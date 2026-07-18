import CameraAggregate from "../Aggregates/CameraTESTAggregate";
import CameraService from "../Services/CameraTESTService";
import type { CameraAxis, CameraConfig } from "../Types/CameraTESTTypes";

export default class CameraAPI {
    private service: CameraService;

    constructor(service?: CameraService) {
        this.service = service ?? new CameraService();
    }

    public New(name: string, config?: CameraConfig): CameraAggregate {
        return this.service.New(name, config);
    }

    public Get(name: string): CameraAggregate {
        return this.service.Get(name);
    }

    public Has(name: string) {
        return this.service.Has(name);
    }

    public Destroy(name: string) {
        this.service.Destroy(name);
    }

    public Clear() {
        this.service.Clear();
    }

    public SetAngle(name: string, axis: CameraAxis, value: number) {
        this.service.Get(name).SetAngle(axis, value);
    }

    public AddAngle(name: string, axis: CameraAxis, value: number) {
        this.service.Get(name).AddAngle(axis, value);
    }

    public GetAngle(name: string, axis: CameraAxis) {
        return this.service.Get(name).GetAngle(axis);
    }

    public Start(name: string) {
        this.service.Get(name).Start();
    }

    public Stop(name: string) {
        this.service.Get(name).Stop();
    }
}
