import { ClickDetectorAggregate } from "../Aggregates/ClickDetectorAggregate";
import { ClickDetectorService } from "../Services/ClickDetectorService";
import { ClickDetectorProperties } from "../Types/ClickDetectorTypes";

export class ClickDetectorAPI {
    public service = new ClickDetectorService();

    public Create(properties: ClickDetectorProperties): ClickDetectorAggregate {
        return this.service.Create(properties);
    }

    public Get(name: string): ClickDetectorAggregate | undefined {
        return this.service.Get(name);
    }

    public Destroy(name: string) {
        this.service.Destroy(name);
    }
}
