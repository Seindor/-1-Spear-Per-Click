import { Janitor } from "@rbxts/janitor";
import { RunService } from "@rbxts/services";
import {
    MotionAggregateState,
    MotionDirection2D,
    MotionDirectionTag,
    MotionProperties,
    MotionSource,
    MotionSourcePreference,
    MotionState,
} from "../Types/MotionTypes";

export class MotionAggregate {
    public rootPart: BasePart;
    public humanoid?: Humanoid;

    private landingGraceTime: number;
    private jumpGraceTime: number;
    private moveThreshold: number;
    private directionThreshold: number;
    private sourcePreference: MotionSourcePreference;

    private janitor = new Janitor<any>();
    private stateData: MotionAggregateState;

    constructor(motionProperties: MotionProperties) {
        this.rootPart = motionProperties.RootPart;
        this.humanoid = motionProperties.Humanoid;

        this.landingGraceTime = motionProperties.LandingGraceTime ?? 0.15;
        this.jumpGraceTime = motionProperties.JumpGraceTime ?? 0.5;
        this.moveThreshold = motionProperties.MoveThreshold ?? 0.05;
        this.directionThreshold = motionProperties.DirectionThreshold ?? 0.25;
        this.sourcePreference = motionProperties.SourcePreference ?? "Auto";

        this.stateData = {
            RootPart: this.rootPart,
            Humanoid: this.humanoid,
            LastGroundedTime: os.clock(),
            LastAirborneTime: 0,
            LastJumpTime: 0,
            State: this.createDefaultState(),
        };

        this.updateState();

        const connection = RunService.Heartbeat.Connect(() => {
            this.updateState();
        });

        this.janitor.Add(connection, "Disconnect", "HeartbeatConnection");
    }

    private createDefaultState(): MotionState {
        return {
            WorldMotionDirection: Vector3.zero,
            LocalMotionDirection: Vector3.zero,

            WorldVelocity: Vector3.zero,
            LocalVelocity: Vector3.zero,

            Speed: 0,
            HorizontalSpeed: 0,
            VerticalSpeed: 0,

            ForwardDot: 0,
            RightDot: 0,
            UpDot: 0,
            CrossY: 0,

            MovementAngle: 0,
            Direction2D: "Idle",
            Direction2DTags: [],
            Direction3DTags: [],
            Source: "Velocity",

            IsMoving: false,

            IsForward: false,
            IsBackward: false,
            IsLeft: false,
            IsRight: false,
            IsUp: false,
            IsDown: false,

            ForwardAmount: 0,
            BackwardAmount: 0,
            LeftAmount: 0,
            RightAmount: 0,
            UpAmount: 0,
            DownAmount: 0,

            IsJumping: false,
            IsFalling: false,
            JustLanded: false,
            HumanoidState: undefined,
        };
    }

    private getHorizontalUnit(vector: Vector3): Vector3 {
        const horizontal = new Vector3(vector.X, 0, vector.Z);
        const magnitude = horizontal.Magnitude;

        if (magnitude <= 0) {
            return Vector3.zero;
        }

        return horizontal.div(magnitude);
    }

    private getDirection2DFromLocalVector(localDirection: Vector3): MotionDirection2D {
        const x = localDirection.X;
        const z = localDirection.Z;
        const threshold = this.directionThreshold;

        if (math.abs(x) < threshold && math.abs(z) < threshold) {
            return "Idle";
        }

        if (z < -threshold) {
            if (x < -threshold) return "ForwardLeft";
            if (x > threshold) return "ForwardRight";
            return "Forward";
        }

        if (z > threshold) {
            if (x < -threshold) return "BackwardLeft";
            if (x > threshold) return "BackwardRight";
            return "Backward";
        }

        if (x < -threshold) return "Left";
        if (x > threshold) return "Right";

        return "Idle";
    }

    private getDirectionTags2D(
        localDirection: Vector3,
    ): Exclude<MotionDirectionTag, "Up" | "Down">[] {
        const tags = new Array<Exclude<MotionDirectionTag, "Up" | "Down">>();
        const threshold = this.directionThreshold;

        if (localDirection.Z < -threshold) {
            tags.push("Forward");
        } else if (localDirection.Z > threshold) {
            tags.push("Backward");
        }

        if (localDirection.X < -threshold) {
            tags.push("Left");
        } else if (localDirection.X > threshold) {
            tags.push("Right");
        }

        return tags;
    }

    private getDirectionTags3D(localDirection: Vector3): MotionDirectionTag[] {
        const tags = new Array<MotionDirectionTag>();
        const threshold = this.directionThreshold;

        if (localDirection.Z < -threshold) {
            tags.push("Forward");
        } else if (localDirection.Z > threshold) {
            tags.push("Backward");
        }

        if (localDirection.X < -threshold) {
            tags.push("Left");
        } else if (localDirection.X > threshold) {
            tags.push("Right");
        }

        if (localDirection.Y < -threshold) {
            tags.push("Up");
        } else if (localDirection.Y > threshold) {
            tags.push("Down");
        }

        return tags;
    }

    private resolveMotionSource(
        worldVelocity: Vector3,
        speed: number,
    ): LuaTuple<[Vector3, MotionSource]> {
        const humanoidMoveDirection = this.humanoid?.MoveDirection ?? Vector3.zero;

        if (this.sourcePreference === "Velocity") {
            if (speed > this.moveThreshold) {
                return $tuple(worldVelocity.Unit, "Velocity");
            }

            return $tuple(Vector3.zero, "Velocity");
        }

        if (this.sourcePreference === "HumanoidMoveDirection") {
            if (humanoidMoveDirection.Magnitude > this.moveThreshold) {
                return $tuple(humanoidMoveDirection.Unit, "HumanoidMoveDirection");
            }

            return $tuple(Vector3.zero, "HumanoidMoveDirection");
        }

        if (humanoidMoveDirection.Magnitude > this.moveThreshold) {
            return $tuple(humanoidMoveDirection.Unit, "HumanoidMoveDirection");
        }

        if (speed > this.moveThreshold) {
            return $tuple(worldVelocity.Unit, "Velocity");
        }

        return $tuple(Vector3.zero, "Velocity");
    }

    private updateState() {
        const worldVelocity = this.rootPart.AssemblyLinearVelocity;
        const speed = worldVelocity.Magnitude;
        const horizontalVelocity = new Vector3(worldVelocity.X, 0, worldVelocity.Z);
        const horizontalSpeed = horizontalVelocity.Magnitude;
        const verticalSpeed = worldVelocity.Y;

        const [worldMotionDirection, source] = this.resolveMotionSource(worldVelocity, speed);

        const localMotionDirection = this.rootPart.CFrame.VectorToObjectSpace(worldMotionDirection);
        const localVelocity = this.rootPart.CFrame.VectorToObjectSpace(worldVelocity);

        const lookVector = this.rootPart.CFrame.LookVector;
        const rightVector = this.rootPart.CFrame.RightVector;
        const upVector = this.rootPart.CFrame.UpVector;

        const flatLook = this.getHorizontalUnit(lookVector);

        const forwardDot = worldMotionDirection.Dot(lookVector);
        const rightDot = worldMotionDirection.Dot(rightVector);
        const upDot = worldMotionDirection.Dot(upVector);
        const crossY = flatLook.Cross(this.getHorizontalUnit(worldMotionDirection)).Y;

        const movementAngle =
            new Vector3(localMotionDirection.X, 0, localMotionDirection.Z).Magnitude > 0
                ? math.atan2(-localMotionDirection.X, -localMotionDirection.Z)
                : 0;

        const direction2D = this.getDirection2DFromLocalVector(localMotionDirection);
        const direction2DTags = this.getDirectionTags2D(localMotionDirection);
        const direction3DTags = this.getDirectionTags3D(localMotionDirection);
        const isMoving = speed > this.moveThreshold;

        const forwardAmount = math.max(0, -localMotionDirection.Z);
        const backwardAmount = math.max(0, localMotionDirection.Z);
        const leftAmount = math.max(0, -localMotionDirection.X);
        const rightAmount = math.max(0, localMotionDirection.X);
        const upAmount = math.max(0, -localMotionDirection.Y);
        const downAmount = math.max(0, localMotionDirection.Y);

        let humanoidState: Enum.HumanoidStateType | undefined = undefined;
        let isJumping = false;
        let isFalling = false;
        let justLanded = false;

        const now = os.clock();

        if (this.humanoid) {
            humanoidState = this.humanoid.GetState();

            const rawIsJumping = humanoidState === Enum.HumanoidStateType.Jumping;
            const rawIsFalling =
                humanoidState === Enum.HumanoidStateType.Freefall && verticalSpeed < 0;

            if (rawIsJumping) {
                this.stateData.LastJumpTime = now;
            }

            const jumpGraceActive =
                now - this.stateData.LastJumpTime <= this.jumpGraceTime && verticalSpeed > -2;

            isJumping = rawIsJumping || (jumpGraceActive && !rawIsFalling);
            isFalling = rawIsFalling && !isJumping;

            const isGrounded =
                humanoidState !== Enum.HumanoidStateType.Freefall &&
                humanoidState !== Enum.HumanoidStateType.Jumping &&
                humanoidState !== Enum.HumanoidStateType.FallingDown;

            const wasAirborne =
                this.stateData.LastHumanoidState === Enum.HumanoidStateType.Freefall ||
                this.stateData.LastHumanoidState === Enum.HumanoidStateType.Jumping ||
                this.stateData.LastHumanoidState === Enum.HumanoidStateType.FallingDown;

            if (!isGrounded) {
                this.stateData.LastAirborneTime = now;
            }

            if (isGrounded) {
                justLanded =
                    wasAirborne && now - this.stateData.LastAirborneTime <= this.landingGraceTime;
                this.stateData.LastGroundedTime = now;
            }

            this.stateData.LastHumanoidState = humanoidState;
        } else {
            const jumpGraceActive =
                now - this.stateData.LastJumpTime <= this.jumpGraceTime && verticalSpeed > -2;

            const rawIsJumping = verticalSpeed > 2;
            const rawIsFalling = verticalSpeed < -2;

            if (rawIsJumping && !jumpGraceActive) {
                this.stateData.LastJumpTime = now;
            }

            isJumping = rawIsJumping || (jumpGraceActive && !rawIsFalling);
            isFalling = rawIsFalling && !isJumping;

            const wasAirborne = this.stateData.State.IsJumping || this.stateData.State.IsFalling;
            const isGrounded = !isJumping && !isFalling;

            if (!isGrounded) {
                this.stateData.LastAirborneTime = now;
            }

            if (isGrounded) {
                justLanded =
                    wasAirborne && now - this.stateData.LastAirborneTime <= this.landingGraceTime;
                this.stateData.LastGroundedTime = now;
            }
        }

        this.stateData.State = {
            WorldMotionDirection: worldMotionDirection,
            LocalMotionDirection: localMotionDirection,

            WorldVelocity: worldVelocity,
            LocalVelocity: localVelocity,

            Speed: speed,
            HorizontalSpeed: horizontalSpeed,
            VerticalSpeed: verticalSpeed,

            ForwardDot: forwardDot,
            RightDot: rightDot,
            UpDot: upDot,
            CrossY: crossY,

            MovementAngle: movementAngle,
            Direction2D: direction2D,
            Direction2DTags: direction2DTags,
            Direction3DTags: direction3DTags,
            Source: source,

            IsMoving: isMoving,

            IsForward: forwardAmount > this.directionThreshold,
            IsBackward: backwardAmount > this.directionThreshold,
            IsLeft: leftAmount > this.directionThreshold,
            IsRight: rightAmount > this.directionThreshold,
            IsUp: upAmount > this.directionThreshold,
            IsDown: downAmount > this.directionThreshold,

            ForwardAmount: forwardAmount,
            BackwardAmount: backwardAmount,
            LeftAmount: leftAmount,
            RightAmount: rightAmount,
            UpAmount: upAmount,
            DownAmount: downAmount,

            IsJumping: isJumping,
            IsFalling: isFalling,
            JustLanded: justLanded,
            HumanoidState: humanoidState,
        };
    }

    public GetState(): MotionState {
        return this.stateData.State;
    }

    public GetDirection2D(): MotionDirection2D {
        return this.stateData.State.Direction2D;
    }

    public GetDirection2DTags(): Exclude<MotionDirectionTag, "Up" | "Down">[] {
        return this.stateData.State.Direction2DTags;
    }

    public GetDirection3DTags(): MotionDirectionTag[] {
        return this.stateData.State.Direction3DTags;
    }

    public HasDirectionTag(directionTag: MotionDirectionTag): boolean {
        return this.stateData.State.Direction3DTags.includes(directionTag);
    }

    public GetMotionDirection(): Vector3 {
        return this.stateData.State.WorldMotionDirection;
    }

    public GetLocalMotionDirection(): Vector3 {
        return this.stateData.State.LocalMotionDirection;
    }

    public GetVelocity(): Vector3 {
        return this.stateData.State.WorldVelocity;
    }

    public GetLocalVelocity(): Vector3 {
        return this.stateData.State.LocalVelocity;
    }

    public GetSpeed(): number {
        return this.stateData.State.Speed;
    }

    public GetHorizontalSpeed(): number {
        return this.stateData.State.HorizontalSpeed;
    }

    public GetVerticalSpeed(): number {
        return this.stateData.State.VerticalSpeed;
    }

    public IsMoving(): boolean {
        return this.stateData.State.IsMoving;
    }

    public Destroy() {
        this.janitor.Cleanup();
    }
}
