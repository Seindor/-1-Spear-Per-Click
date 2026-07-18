import { RenderDistanceAggregate } from "../Aggregates/RenderDistanceAggregate";
import { RenderDistanceProperties } from "../Types/RenderDistanceTypes";

export class RenderDistanceService {
    private renders = new Map<string, RenderDistanceAggregate>();

    public Create(properties: RenderDistanceProperties, name: string): RenderDistanceAggregate {
        if (this.renders.has(name)) {
            return this.renders.get(name)!;
        }

        const aggregate = new RenderDistanceAggregate(properties);

        this.renders.set(name, aggregate);

        return aggregate;
    }

    public Get(name: string) {
        return this.renders.get(name);
    }

    public Destroy(name: string) {
        const render = this.renders.get(name);

        if (!render) return;

        render.Destroy();

        this.renders.delete(name);
    }
}
