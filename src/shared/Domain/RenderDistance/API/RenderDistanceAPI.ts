import { RenderDistanceAggregate } from "../Aggregates/RenderDistanceAggregate";
import { RenderDistanceService } from "../Services/RenderDistanceService";

export class RenderDistanceAPI {
    public service = new RenderDistanceService();

    public Create(
        instance: Instance,
        distance: number,
        origin: BasePart,
        name: string,
    ): RenderDistanceAggregate {
        return this.service.Create(
            {
                instance,
                distance,
                origin,
            },
            name,
        );
    }

    public Get(name: string) {
        return this.service.Get(name);
    }

    public Destroy(name: string) {
        this.service.Destroy(name);
    }
}
