import CameraAggregate from "../Aggregates/CameraTESTAggregate";
import type { CameraConfig } from "../Types/CameraTESTTypes";

export default class CameraService {
    private cameras = new Map<string, CameraAggregate>();

    public New(name: string, config?: CameraConfig): CameraAggregate {
        const cached = this.cameras.get(name);
        if (cached) {
            return cached;
        }

        const camera = new CameraAggregate(config);
        this.cameras.set(name, camera);

        return camera;
    }

    public Get(name: string): CameraAggregate {
        return this.cameras.get(name) ?? this.New(name);
    }

    public Has(name: string) {
        return this.cameras.has(name);
    }

    public Destroy(name: string) {
        const camera = this.cameras.get(name);
        if (!camera) return;

        camera.Destroy();
        this.cameras.delete(name);
    }

    public Clear() {
        for (const [, camera] of this.cameras) {
            camera.Destroy();
        }

        this.cameras.clear();
    }
}
