import { CameraAggregate } from "../Aggregates/CameraAggregate";

export class CameraService {
    public cameras = new Map<string, CameraAggregate>();

    private resolveCameraName(cameraName?: string): string {
        return cameraName ?? "Camera";
    }

    public CreateCamera(cameraName?: string): CameraAggregate {
        const resolvedCameraName = this.resolveCameraName(cameraName);

        if (this.cameras.has(resolvedCameraName)) {
            return this.cameras.get(resolvedCameraName)!;
        }

        const camera = new CameraAggregate();
        this.cameras.set(resolvedCameraName, camera);

        return camera;
    }

    public GetCamera(cameraName?: string): CameraAggregate | undefined {
        return this.cameras.get(this.resolveCameraName(cameraName));
    }

    public HasCamera(cameraName?: string): boolean {
        return this.cameras.has(this.resolveCameraName(cameraName));
    }

    public RemoveCamera(cameraName?: string): boolean {
        const resolvedCameraName = this.resolveCameraName(cameraName);
        const camera = this.cameras.get(resolvedCameraName);

        if (!camera) {
            return false;
        }

        camera.Destroy();
        this.cameras.delete(resolvedCameraName);

        return true;
    }
}
