import EventBusAggregate from "../Aggregates/EventBusAggregate";
import EventBusService from "../Services/EventBusService";

export default class EventBusAPI {
    private service: EventBusService;

    constructor(service?: EventBusService) {
        this.service = service ?? new EventBusService();
    }

    public New(ownerId: string, busName: string): EventBusAggregate {
        return this.service.New(ownerId, busName);
    }

    public Get(ownerId: string, busName: string): EventBusAggregate {
        return this.service.Get(ownerId, busName);
    }

    public GetOwnerBuses(ownerId: string): Map<string, EventBusAggregate> | undefined {
        return this.service.GetOwnerBuses(ownerId);
    }

    public Has(ownerId: string, busName: string) {
        return this.service.Has(ownerId, busName);
    }

    public Destroy(ownerId: string, busName: string) {
        this.service.Destroy(ownerId, busName);
    }

    public DestroyOwner(ownerId: string) {
        this.service.DestroyOwner(ownerId);
    }

    public Clear() {
        this.service.Clear();
    }
}
