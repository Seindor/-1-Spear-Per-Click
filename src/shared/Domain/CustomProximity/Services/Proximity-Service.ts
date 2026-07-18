import { ProximtyAggregate } from "../Aggregates/Proximity-Aggregate";
import { IProximity, ProximityCallBacks } from "../Types/Type";

export class ProximtyService {
    private proximityMap = new Map<BasePart, IProximity>();
    public Create(BasePart: BasePart, Callbacks: ProximityCallBacks | undefined): IProximity {
        const proximity = new ProximtyAggregate(BasePart, Callbacks);
        this.proximityMap.set(BasePart, proximity);

        return proximity;
    }
    public Destroy(BasePart: BasePart) {
        const promt = this.proximityMap.get(BasePart);
        if (!promt) return;
        promt.object.Destroy();
        promt.janitor.Cleanup();
    }

    public ChangeCallBack(
        BasePart: BasePart,
        Name: keyof ProximityCallBacks,
        callback: ProximityCallBacks[keyof ProximityCallBacks],
    ) {
        const promt = this.proximityMap.get(BasePart);
        if (!promt || !promt.callBacks) {
            warn("i cant find promt or callbacks");
            print(BasePart);
            print(this.proximityMap);
            return;
        }
        (promt!.callBacks as any)[Name] = callback;
    }
}
