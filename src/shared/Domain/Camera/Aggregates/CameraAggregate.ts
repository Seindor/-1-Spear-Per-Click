import { Workspace } from "@rbxts/services";
import { CameraState, CameraVectorName } from "../Types/CameraTypes";

export class CameraAggregate {
    private state: CameraState;

    constructor() {
        const currentCamera = Workspace.CurrentCamera;
        assert(currentCamera, "CurrentCamera was not found.");

        this.state = {
            CFrame: currentCamera.CFrame,
            FieldOfView: currentCamera.FieldOfView,
        };
    }

    private getCurrentCamera(): Camera {
        const currentCamera = Workspace.CurrentCamera;
        assert(currentCamera, "CurrentCamera was not found.");
        return currentCamera;
    }

    private updateState() {
        const currentCamera = this.getCurrentCamera();

        this.state.CFrame = currentCamera.CFrame;
        this.state.FieldOfView = currentCamera.FieldOfView;
    }

    public GetCFrame(): CFrame {
        this.updateState();
        return this.state.CFrame;
    }

    public GetPosition(): Vector3 {
        return this.GetCFrame().Position;
    }

    public GetVector(vectorName: CameraVectorName): Vector3 {
        const cameraCFrame = this.GetCFrame();

        if (vectorName === "Look") {
            return cameraCFrame.LookVector;
        }

        if (vectorName === "Right") {
            return cameraCFrame.RightVector;
        }

        return cameraCFrame.UpVector;
    }

    public GetFieldOfView(): number {
        this.updateState();
        return this.state.FieldOfView;
    }

    public SetFieldOfView(value: number) {
        const currentCamera = this.getCurrentCamera();
        currentCamera.FieldOfView = value;
        this.state.FieldOfView = value;
    }

    public Destroy() {}
}
