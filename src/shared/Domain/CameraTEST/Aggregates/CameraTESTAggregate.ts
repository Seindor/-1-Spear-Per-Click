import { RunService, UserInputService, Workspace, Players } from "@rbxts/services";
import { Janitor } from "@rbxts/janitor";
import type { CameraAxis, CameraConfig, CameraState } from "../Types/CameraTESTTypes";

export default class CameraAggregate {
    private janitor = new Janitor<any>();

    private target?: BasePart;
    private enabled = false;

    private state: CameraState = {
        Horizontal: 0,
        Vertical: 0,
        Roll: 0,
    };

    private sensitivity: number;
    private distance: number;
    private minDistance: number;
    private maxDistance: number;
    private height: number;
    private verticalLimitDeg: number;

    constructor(config?: CameraConfig) {
        this.sensitivity = config?.Sensitivity ?? UserInputService.MouseDeltaSensitivity * 0.01;
        this.distance = config?.Distance ?? 10;
        this.minDistance = config?.MinDistance ?? 2;
        this.maxDistance = config?.MaxDistance ?? 24;
        this.height = config?.Height ?? 2;
        this.verticalLimitDeg = config?.VerticalLimitDeg ?? 180;
    }

    public SetTarget(target: BasePart) {
        this.target = target;
    }

    public GetTarget() {
        return this.target;
    }

    public SetAngle(axis: CameraAxis, value: number) {
        this.state[axis] = value;

        if (axis === "Vertical") {
            this.state.Vertical = this.NormalizeVertical(this.state.Vertical);
        }
    }

    public AddAngle(axis: CameraAxis, value: number) {
        this.state[axis] += value;

        if (axis === "Vertical") {
            this.state.Vertical = this.NormalizeVertical(this.state.Vertical);
        }
    }

    public GetAngle(axis: CameraAxis) {
        return this.state[axis];
    }

    public SetDistance(value: number) {
        this.distance = math.clamp(value, this.minDistance, this.maxDistance);
    }

    public GetDistance() {
        return this.distance;
    }

    public SetVerticalLimitDeg(value: number) {
        this.verticalLimitDeg = value;
        this.state.Vertical = this.NormalizeVertical(this.state.Vertical);
    }

    public GetVerticalLimitDeg() {
        return this.verticalLimitDeg;
    }

    private GetFocusPosition() {
        if (!this.target) {
            return Vector3.zero;
        }

        return this.target.Position.add(new Vector3(0, this.height, 0));
    }

    private NormalizeVertical(value: number) {
        if (this.verticalLimitDeg >= 360) {
            return value;
        }

        const halfRangeRad = math.rad(this.verticalLimitDeg * 0.5);
        return math.clamp(value, -halfRangeRad, halfRangeRad);
    }

    private SyncFromCurrentCamera() {
        if (!this.target) {
            return;
        }

        const camera = Workspace.CurrentCamera;
        if (!camera) {
            return;
        }

        const focus = this.GetFocusPosition();
        const offset = focus.sub(camera.CFrame.Position);

        this.distance = math.clamp(offset.Magnitude, this.minDistance, this.maxDistance);

        const look = camera.CFrame.LookVector;

        this.state.Horizontal = math.atan2(-look.X, -look.Z);
        this.state.Vertical = this.NormalizeVertical(math.asin(math.clamp(look.Y, -1, 1)));
    }

    public Start() {
        if (this.enabled || !this.target) {
            return;
        }

        const camera = Workspace.CurrentCamera;
        if (!camera) {
            return;
        }

        this.SyncFromCurrentCamera();

        this.enabled = true;
        camera.CameraType = Enum.CameraType.Scriptable;

        UserInputService.MouseBehavior = Enum.MouseBehavior.LockCenter;
        UserInputService.MouseIconEnabled = false;

        this.janitor.Add(
            UserInputService.InputChanged.Connect((input, gameProcessed) => {
                if (!this.enabled || gameProcessed) {
                    return;
                }

                if (input.UserInputType === Enum.UserInputType.MouseMovement) {
                    const delta = input.Delta;

                    const horizontalDirection = math.cos(this.state.Vertical) >= 0 ? 1 : -1;

                    this.state.Horizontal -= delta.X * this.sensitivity * horizontalDirection;
                    this.state.Vertical = this.NormalizeVertical(
                        this.state.Vertical - delta.Y * this.sensitivity,
                    );
                } else if (input.UserInputType === Enum.UserInputType.MouseWheel) {
                    const wheel = input.Position.Z;
                    this.distance = math.clamp(
                        this.distance - wheel * 2,
                        this.minDistance,
                        this.maxDistance,
                    );
                }
            }),
            "Disconnect",
            "CameraInput",
        );

        this.janitor.Add(
            RunService.RenderStepped.Connect(() => {
                this.Update();
            }),
            "Disconnect",
            "CameraRender",
        );
    }

    public Stop() {
        if (!this.enabled) {
            return;
        }

        this.enabled = false;

        this.janitor.Remove("CameraInput");
        this.janitor.Remove("CameraRender");

        UserInputService.MouseBehavior = Enum.MouseBehavior.Default;
        UserInputService.MouseIconEnabled = true;

        const camera = Workspace.CurrentCamera;
        if (camera) {
            camera.CameraType = Enum.CameraType.Custom;
        }
    }

    public Update() {
        if (!this.enabled || !this.target) {
            return;
        }

        const camera = Workspace.CurrentCamera;
        if (!camera) {
            return;
        }

        const focus = this.GetFocusPosition();

        const rotation = CFrame.Angles(0, this.state.Horizontal, 0)
            .mul(CFrame.Angles(this.state.Vertical, 0, 0))
            .mul(CFrame.Angles(0, 0, this.state.Roll));

        const position = focus.sub(rotation.LookVector.mul(this.distance));

        camera.CFrame = CFrame.lookAt(position, focus, rotation.UpVector);
        camera.Focus = new CFrame(focus);
    }

    public Destroy() {
        this.Stop();
        this.janitor.Cleanup();
        this.target = undefined;
    }
}
