import { StatusAggregate } from "../Aggregates/StatusAggregate";
import { StatusEffectsService } from "../Services/StatusEffectsService";
import { BlacklistedStatus, StatusAggregateOptions } from "../Types/StatusTypes";

import { IStatusId as StatusId } from "../Types/StatusTypes";

export class StatusEffectsAPI {
    readonly service: StatusEffectsService;
    constructor() {
        this.service = new StatusEffectsService();
    }

    public InitActor(actorId: string) {
        this.service.InitActor(actorId);
    }

    public CreateStatus(
        statusName: StatusId,
        options?: StatusAggregateOptions,
        autoAdd?: boolean,
        actorId?: string,
    ): StatusAggregate {
        return this.service.CreateStatus(statusName, options, autoAdd, actorId);
    }

    public AddStatus(actorId: string, newStatus: StatusAggregate): StatusAggregate {
        return this.service.AddStatus(actorId, newStatus);
    }

    public EnsureActor(actorId: string): StatusAggregate[] {
        return this.service.EnsureActor(actorId);
    }

    public HasStatus(actorId: string, statusId: StatusId): boolean {
        return this.service.HasStatus(actorId, statusId);
    }

    public Subscribe(
        actorId: string,
        statuses:
            | {
                  status: StatusId;
                  event: "Added" | "Removed";
              }[]
            | "All",
        callback: (event: "Added" | "Removed", status: StatusAggregate) => void,
        name: string,
    ) {
        return this.service.Subscribe(actorId, statuses, callback, name);
    }

    public Unsubscribe(actorId: string, name: string) {
        this.service.Unsubscribe(actorId, name);
    }

    public GetStatuses(actorId: string): StatusAggregate[] | undefined {
        return this.service.GetStatuses(actorId);
    }

    public GetStatus(actorId: string, statusName: StatusId): StatusAggregate | undefined {
        return this.service.GetStatus(actorId, statusName);
    }

    public RemoveStatus(actorId: string, statusName: StatusId) {
        this.service.RemoveStatus(actorId, statusName);
    }

    public RemoveAllStatuses(actorId: string) {
        this.service.RemoveAllStatuses(actorId);
    }

    public CheckStatuses(
        actorId: string,
        statuses: StatusId[],
        ignoreList?: BlacklistedStatus[],
        customList?: StatusAggregate[],
    ): boolean {
        return this.service.CheckStatuses(actorId, statuses, ignoreList, customList);
    }
}
