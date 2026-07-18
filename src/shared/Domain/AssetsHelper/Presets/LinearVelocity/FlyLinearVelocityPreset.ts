import { Workspace, RunService } from "@rbxts/services";
import { Janitor } from "@rbxts/janitor";
import { LinearVelocityAggregate } from "../../Aggregates/LinearVelocityAggregate";
import {
    FlyLinearVelocityPresetMethods,
    FlyLinearVelocityPresetProperties,
} from "../../Types/AssetsHelperPresetTypes";

export class FlyLinearVelocityPreset
    extends LinearVelocityAggregate
    implements FlyLinearVelocityPresetMethods
{
    private humanoid: Humanoid;
    private speed: number;
    private stopTime: number;
    private startTime: number;

    private currentVelocity = Vector3.zero;
    private presetJanitor = new Janitor<Instance | RBXScriptConnection>();
    private speedLerpConnection?: RBXScriptConnection;
    private movementConnection?: RBXScriptConnection;

    constructor(properties: FlyLinearVelocityPresetProperties) {
        super({
            Name: properties.Name,
            Parent: properties.Parent,
            Attachment0: properties.Attachment0,
            DeleteAttachmentsOnDestroy: properties.DeleteAttachmentsOnDestroy ?? false,
            RelativeTo: Enum.ActuatorRelativeTo.World,
            VelocityConstraintMode: Enum.VelocityConstraintMode.Vector,
            ForceLimitsEnabled: false,
            MaxForce: properties.MaxForce ?? math.huge,
            VectorVelocity: Vector3.zero,
        });

        this.humanoid = properties.Humanoid;
        this.speed = properties.Speed ?? 120;
        this.stopTime = properties.StopTime ?? 0.35;
        this.startTime = properties.StartTime ?? 0.15;

        this.movementConnection = RunService.Heartbeat.Connect((dt: number) => {
            const camera = Workspace.CurrentCamera;
            if (!camera) {
                this.currentVelocity = Vector3.zero;
                this.instance.VectorVelocity = Vector3.zero;
                return;
            }

            const direction = this.getFlightDirection(this.humanoid, camera);
            const targetVelocity = direction.mul(this.speed);

            const hasInput = direction.Magnitude > 0.001;
            const smoothTime = hasInput ? this.startTime : this.stopTime;

            if (smoothTime <= 0) {
                this.currentVelocity = targetVelocity;
            } else {
                const alpha = math.clamp(dt / smoothTime, 0, 1);
                this.currentVelocity = this.currentVelocity.Lerp(targetVelocity, alpha);
            }

            if (this.currentVelocity.Magnitude <= 0.001) {
                this.currentVelocity = Vector3.zero;
            }

            this.instance.VectorVelocity = this.currentVelocity;
        });

        this.presetJanitor.Add(this.movementConnection);
    }

    private getFlightDirection(humanoid: Humanoid, camera: Camera): Vector3 {
        const moveDir = humanoid.MoveDirection;

        if (moveDir.Magnitude <= 0.001) {
            return Vector3.zero;
        }

        const camLook = camera.CFrame.LookVector;
        const camRight = camera.CFrame.RightVector;
        const camUp = camera.CFrame.UpVector;

        const flatForwardRaw = new Vector3(camLook.X, 0, camLook.Z);
        if (flatForwardRaw.Magnitude <= 0.001) {
            return Vector3.zero;
        }

        const flatForward = flatForwardRaw.Unit;

        let flatRight = flatForward.Cross(Vector3.yAxis).Unit;

        const upsideDownSign = camUp.Y >= 0 ? 1 : -1;
        flatRight = flatRight.mul(upsideDownSign);

        const forwardAmount = moveDir.Dot(flatForward);
        const rightAmount = moveDir.Dot(flatRight);

        const correctedRight = camRight.mul(upsideDownSign);

        const desiredDirection = camLook.mul(forwardAmount).add(correctedRight.mul(rightAmount));
        if (desiredDirection.Magnitude <= 0.001) {
            return Vector3.zero;
        }

        return desiredDirection.Unit;
    }

    public SetSpeed(value: number) {
        this.speed = value;
    }

    public LerpSpeed(target: number, duration: number) {
        this.speedLerpConnection?.Disconnect();
        this.speedLerpConnection = undefined;

        if (duration <= 0) {
            this.speed = target;
            return;
        }

        const start = this.speed;
        let elapsed = 0;

        this.speedLerpConnection = RunService.Heartbeat.Connect((dt: number) => {
            elapsed += dt;

            const alpha = math.clamp(elapsed / duration, 0, 1);
            this.speed = start + (target - start) * alpha;

            if (alpha >= 1) {
                this.speedLerpConnection?.Disconnect();
                this.speedLerpConnection = undefined;
            }
        });

        this.presetJanitor.Add(this.speedLerpConnection);
    }

    public Stop() {
        this.currentVelocity = Vector3.zero;
        this.instance.VectorVelocity = Vector3.zero;
    }

    public override Destroy() {
        this.speedLerpConnection?.Disconnect();
        this.movementConnection?.Disconnect();
        this.Stop();
        this.presetJanitor.Cleanup();
        super.Destroy();
    }
}
