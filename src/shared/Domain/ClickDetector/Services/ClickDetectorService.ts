import { ClickDetectorAggregate } from "../Aggregates/ClickDetectorAggregate";
import { ClickDetectorProperties } from "../Types/ClickDetectorTypes";

export class ClickDetectorService {
    private detectors = new Map<string, ClickDetectorAggregate>();

    public Create(properties: ClickDetectorProperties): ClickDetectorAggregate {
        const key = properties.name;

        if (this.detectors.has(key)) {
            warn(`ClickDetector ${key} already exists.`);
            return this.detectors.get(key)!;
        }

        const clickDetector = new Instance("ClickDetector");

        clickDetector.MaxActivationDistance = properties.maxActivationDistance ?? 32;

        clickDetector.CursorIcon = properties.cursorIcon ?? "";

        clickDetector.Parent = properties.parent;

        const aggregate = new ClickDetectorAggregate(properties, clickDetector);

        this.detectors.set(key, aggregate);

        return aggregate;
    }

    public Get(name: string): ClickDetectorAggregate | undefined {
        return this.detectors.get(name);
    }

    public Destroy(name: string): void {
        const detector = this.detectors.get(name);

        if (!detector) return;

        detector.Destroy();

        this.detectors.delete(name);
    }
}
