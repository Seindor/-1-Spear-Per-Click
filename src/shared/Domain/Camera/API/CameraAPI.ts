import { CameraAggregate } from "../Aggregates/CameraAggregate";
import { CameraService } from "../Services/CameraService";

export class CameraAPI {
    private service = new CameraService();

    public CreateCamera(cameraName?: string): CameraAggregate {
        return this.service.CreateCamera(cameraName);
    }

    public GetCamera(cameraName?: string): CameraAggregate | undefined {
        return this.service.GetCamera(cameraName);
    }

    public HasCamera(cameraName?: string): boolean {
        return this.service.HasCamera(cameraName);
    }

    public RemoveCamera(cameraName?: string): boolean {
        return this.service.RemoveCamera(cameraName);
    }
}
