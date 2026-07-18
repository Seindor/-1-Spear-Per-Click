import EventBusAggregate from "../Aggregates/EventBusAggregate";

export default class EventBusService {
    private buses = new Map<string, Map<string, EventBusAggregate>>();

    public New(ownerId: string, busName: string): EventBusAggregate {
        let ownerBuses = this.buses.get(ownerId);

        if (!ownerBuses) {
            ownerBuses = new Map<string, EventBusAggregate>();
            this.buses.set(ownerId, ownerBuses);
        }

        const cached = ownerBuses.get(busName);
        if (cached) {
            return cached;
        }

        const bus = new EventBusAggregate(ownerId, busName);
        ownerBuses.set(busName, bus);

        return bus;
    }

    public Get(ownerId: string, busName: string): EventBusAggregate {
        return this.buses.get(ownerId)?.get(busName) || this.New(ownerId, busName);
    }

    public GetOwnerBuses(ownerId: string): Map<string, EventBusAggregate> | undefined {
        return this.buses.get(ownerId);
    }

    public Has(ownerId: string, busName: string): boolean {
        return this.buses.get(ownerId)?.has(busName) ?? false;
    }

    public Destroy(ownerId: string, busName: string) {
        const ownerBuses = this.buses.get(ownerId);
        if (!ownerBuses) return;

        const bus = ownerBuses.get(busName);
        if (!bus) return;

        bus.Destroy();
        ownerBuses.delete(busName);

        if (ownerBuses.size() === 0) {
            this.buses.delete(ownerId);
        }
    }

    public DestroyOwner(ownerId: string) {
        const ownerBuses = this.buses.get(ownerId);
        if (!ownerBuses) return;

        for (const [, bus] of ownerBuses) {
            bus.Destroy();
        }

        this.buses.delete(ownerId);
    }

    public Clear() {
        for (const [, ownerBuses] of this.buses) {
            for (const [, bus] of ownerBuses) {
                bus.Destroy();
            }
        }

        this.buses.clear();
    }
}
