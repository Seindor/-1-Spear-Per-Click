import { ReplicatedStatus, StatusId } from "shared/Types/GlobalStatusEffectsTypes";
import { ReplicatedStatusEffectsService } from "../Services/ReplicatedStatusEffectsService";
import { BlacklistedStatus } from "../Types/StatusTypes";

export class ReplicatedStatusEffectsAPI {
    readonly service = new ReplicatedStatusEffectsService();

    public InitActor(actorId: string) {
        this.service.InitActor(actorId);
    }

    public CreateStatus(actorId: string, data: Partial<ReplicatedStatus>, autoAdd?: boolean) {
        return this.service.CreateStatus(actorId, data, autoAdd);
    }

    public AddStatus(actorId: string, status: ReplicatedStatus) {
        return this.service.AddStatus(actorId, status);
    }

    public RemoveStatus(actorId: string, statusId: StatusId) {
        this.service.RemoveStatus(actorId, statusId);
    }

    public RemoveAllStatuses(actorId: string) {
        this.service.RemoveAllStatuses(actorId);
    }

    public Set(actorId: string, statuses: ReplicatedStatus[]) {
        this.service.Set(actorId, statuses);
    }

    public Clear(actorId: string) {
        this.service.Clear(actorId);
    }

    public GetStatuses(actorId: string) {
        return this.service.GetStatuses(actorId);
    }

    public GetStatus(actorId: string, statusId: StatusId) {
        return this.service.GetStatus(actorId, statusId);
    }

    public GetClientStatuses(actorId: string) {
        return this.service.GetClientStatuses(actorId);
    }

    public GetReplicatedStatuses(actorId: string) {
        return this.service.GetReplicatedStatuses(actorId);
    }

    public GetClientStatus(actorId: string, statusId: StatusId) {
        return this.service.GetClientStatus(actorId, statusId);
    }

    public GetReplicatedStatus(actorId: string, statusId: StatusId) {
        return this.service.GetReplicatedStatus(actorId, statusId);
    }

    public HasStatus(actorId: string, statusId: StatusId) {
        return this.service.HasStatus(actorId, statusId);
    }

    public HasClientStatus(actorId: string, statusId: StatusId) {
        return this.service.HasClientStatus(actorId, statusId);
    }

    public HasReplicatedStatus(actorId: string, statusId: StatusId) {
        return this.service.HasReplicatedStatus(actorId, statusId);
    }

    public CheckStatuses(actorId: string, statuses: StatusId[], ignoreList?: BlacklistedStatus[]) {
        return this.service.CheckStatuses(actorId, statuses, ignoreList);
    }

    public CheckClientStatuses(
        actorId: string,
        statuses: StatusId[],
        ignoreList?: BlacklistedStatus[],
        customList?: ReplicatedStatus[],
    ) {
        return this.service.CheckClientStatuses(actorId, statuses, ignoreList, customList);
    }

    public CheckReplicatedStatuses(
        actorId: string,
        statuses: StatusId[],
        ignoreList?: BlacklistedStatus[],
        customList?: ReplicatedStatus[],
    ) {
        return this.service.CheckReplicatedStatuses(actorId, statuses, ignoreList, customList);
    }

    public Subscribe(
        actorId: string,
        statuses: {
            status: StatusId;
            event: "Added" | "Removed";
        }[],
        callback: (event: "Added" | "Removed", status: ReplicatedStatus) => void,
        name?: string,
    ) {
        return this.service.Subscribe(actorId, statuses, callback, name);
    }

    public Unsubscribe(actorId: string, name: string) {
        this.service.Unsubscribe(actorId, name);
    }
}
