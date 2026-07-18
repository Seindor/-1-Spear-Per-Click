export interface MotionProperties {
    RootPart: BasePart;
    Humanoid?: Humanoid;
    LandingGraceTime?: number;
    JumpGraceTime?: number;
    MoveThreshold?: number;
    DirectionThreshold?: number;
    SourcePreference?: MotionSourcePreference;
}

export type MotionDirection2D = [
    "Idle",
    "Forward",
    "Backward",
    "Left",
    "Right",
    "ForwardLeft",
    "ForwardRight",
    "BackwardLeft",
    "BackwardRight",
][number];

export type MotionDirectionTag = ["Forward", "Backward", "Left", "Right", "Up", "Down"][number];

export type MotionSource = ["HumanoidMoveDirection", "Velocity"][number];
export type MotionSourcePreference = ["Auto", "HumanoidMoveDirection", "Velocity"][number];

export type MotionState = {
    WorldMotionDirection: Vector3;
    LocalMotionDirection: Vector3;

    WorldVelocity: Vector3;
    LocalVelocity: Vector3;

    Speed: number;
    HorizontalSpeed: number;
    VerticalSpeed: number;

    ForwardDot: number;
    RightDot: number;
    UpDot: number;
    CrossY: number;

    MovementAngle: number;
    Direction2D: MotionDirection2D;
    Direction2DTags: Exclude<MotionDirectionTag, "Up" | "Down">[];
    Direction3DTags: MotionDirectionTag[];
    Source: MotionSource;

    IsMoving: boolean;

    IsForward: boolean;
    IsBackward: boolean;
    IsLeft: boolean;
    IsRight: boolean;
    IsUp: boolean;
    IsDown: boolean;

    ForwardAmount: number;
    BackwardAmount: number;
    LeftAmount: number;
    RightAmount: number;
    UpAmount: number;
    DownAmount: number;

    IsJumping: boolean;
    IsFalling: boolean;
    JustLanded: boolean;
    HumanoidState?: Enum.HumanoidStateType;
};

export type MotionAggregateState = {
    RootPart: BasePart;
    Humanoid?: Humanoid;

    LastHumanoidState?: Enum.HumanoidStateType;
    LastGroundedTime: number;
    LastAirborneTime: number;
    LastJumpTime: number;

    State: MotionState;
};
