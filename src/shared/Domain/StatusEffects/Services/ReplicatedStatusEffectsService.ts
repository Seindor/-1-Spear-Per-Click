import { Workspace } from "@rbxts/services";
import { ReplicatedStatus, StatusId } from "shared/Types/GlobalStatusEffectsTypes";
import { BlacklistedStatus } from "../Types/StatusTypes";
import { Janitor } from "@rbxts/janitor";

export type ReplicatedStatusEvent = "Added" | "Removed";

type Subscriber = {
    name?: string;
    statuses: {
        status: StatusId;
        event: ReplicatedStatusEvent;
    }[];
    callback: (event: ReplicatedStatusEvent, status: ReplicatedStatus) => void;
};

export class ReplicatedStatusEffectsService {
    public _janitor = new Janitor<any>();
    private readonly replicatedMap = new Map<string, ReplicatedStatus[]>();

    private readonly clientMap = new Map<string, ReplicatedStatus[]>();

    private readonly subscribers = new Map<string, Subscriber[]>();

    public OnChanged?: (actorId: string, statuses: ReplicatedStatus[]) => void;

    public InitActor(actorId: string) {
        if (!this.replicatedMap.has(actorId)) {
            this.replicatedMap.set(actorId, []);
        }

        if (!this.clientMap.has(actorId)) {
            this.clientMap.set(actorId, []);
        }
    }

    private ensureClient(actorId: string) {
        if (!this.clientMap.has(actorId)) {
            this.clientMap.set(actorId, []);
        }

        return this.clientMap.get(actorId)!;
    }

    public CreateStatus(
        actorId: string,
        data: Partial<ReplicatedStatus>,
        autoAdd?: boolean,
    ): ReplicatedStatus {
        const list = this.ensureClient(actorId);

        const existing = list.find((s) => s.id === data.id);

        if (existing) {
            this._janitor.Remove(`ClientStatus_${actorId}_${data.id}`);

            if (existing.duration !== math.huge) {
                this._janitor.Add(
                    task.delay(existing.duration, () => {
                        this.RemoveStatus(actorId, data.id!);
                    }),
                    true,
                    `ClientStatus_${actorId}_${data.id!}`,
                );
            }

            return existing;
        }

        const status: ReplicatedStatus = {
            id: data.id!,
            priority: data?.priority ?? 1,
            spawned: data?.spawned ?? Workspace.GetServerTimeNow(),
            duration: data?.duration ?? math.huge,
            stacks: data?.stacks ?? 1,
            stackBehavior: data?.stackBehavior,
            tags: data?.tags ?? [],
            miscData: data?.miscData ?? {},
        };

        if (autoAdd) {
            this.AddStatus(actorId, status);
        }

        if (status.duration !== math.huge) {
            this._janitor.Add(
                task.delay(status.duration, () => {
                    this.RemoveStatus(actorId, data.id!);
                }),
                true,
                `ClientStatus_${actorId}_${data.id!}`,
            );
        }

        return status;
    }

    public AddStatus(actorId: string, status: ReplicatedStatus) {
        const list = this.ensureClient(actorId);

        const existingIndex = list.findIndex((x) => x.id === status.id);

        if (existingIndex !== -1) {
            list[existingIndex] = status;
        } else {
            list.push(status);

            this.notify(actorId, "Added", status);
        }

        this.notifyChanged(actorId);

        return status;
    }

    public RemoveStatus(actorId: string, statusId: StatusId) {
        const list = this.clientMap.get(actorId);

        if (!list) return;

        const index = list.findIndex((x) => x.id === statusId);

        if (index === -1) return;

        const removed = list[index];

        list.remove(index);

        this.notify(actorId, "Removed", removed);

        this.notifyChanged(actorId);
    }

    public RemoveAllStatuses(actorId: string) {
        const list = this.clientMap.get(actorId);

        if (!list) return;

        for (const status of list) {
            this.notify(actorId, "Removed", status);
        }

        list.clear();

        this.notifyChanged(actorId);
    }

    public Set(actorId: string, newStatuses: ReplicatedStatus[]) {
        const oldStatuses = this.replicatedMap.get(actorId) ?? [];

        const oldMap = new Map(oldStatuses.map((x) => [x.id, x]));
        const newMap = new Map(newStatuses.map((x) => [x.id, x]));

        this.replicatedMap.set(actorId, newStatuses);

        for (const [id, status] of newMap) {
            if (!oldMap.has(id)) {
                this.notify(actorId, "Added", status);
            }
        }

        for (const [id, status] of oldMap) {
            if (!newMap.has(id)) {
                this.notify(actorId, "Removed", status);
            }
        }

        this.notifyChanged(actorId);
    }

    public Clear(actorId: string) {
        const statuses = this.replicatedMap.get(actorId);

        if (!statuses) return;

        for (const status of statuses) {
            this.notify(actorId, "Removed", status);
        }

        this.replicatedMap.set(actorId, []);

        this.notifyChanged(actorId);
    }

    public GetClientStatuses(actorId: string): ReplicatedStatus[] {
        return this.clientMap.get(actorId) ?? [];
    }

    public GetReplicatedStatuses(actorId: string): ReplicatedStatus[] {
        return this.replicatedMap.get(actorId) ?? [];
    }

    public GetStatuses(actorId: string): ReplicatedStatus[] {
        const replicated = this.replicatedMap.get(actorId) ?? [];
        const client = this.clientMap.get(actorId) ?? [];

        return [...replicated, ...client];
    }

    public GetClientStatus(actorId: string, statusId: StatusId): ReplicatedStatus | undefined {
        return this.clientMap.get(actorId)?.find((status) => status.id === statusId);
    }

    public GetReplicatedStatus(actorId: string, statusId: StatusId): ReplicatedStatus | undefined {
        return this.replicatedMap.get(actorId)?.find((status) => status.id === statusId);
    }

    public GetStatus(actorId: string, statusId: StatusId): ReplicatedStatus | undefined {
        return (
            this.GetClientStatus(actorId, statusId) ?? this.GetReplicatedStatus(actorId, statusId)
        );
    }

    public HasClientStatus(actorId: string, statusId: StatusId): boolean {
        const list = this.clientMap.get(actorId);

        if (!list) return false;

        return list.some((status) => status.id === statusId);
    }

    public HasReplicatedStatus(actorId: string, statusId: StatusId): boolean {
        const list = this.replicatedMap.get(actorId);

        if (!list) return false;

        return list.some((status) => status.id === statusId);
    }

    public HasStatus(actorId: string, statusId: StatusId): boolean {
        return (
            this.HasClientStatus(actorId, statusId) || this.HasReplicatedStatus(actorId, statusId)
        );
    }

    public CheckClientStatuses(
        actorId: string,
        statuses: StatusId[],
        ignoreList?: BlacklistedStatus[],
        customList?: ReplicatedStatus[],
    ): boolean {
        const list = customList ?? this.clientMap.get(actorId);

        if (!list) return false;

        return this.checkInternal(list, statuses, ignoreList);
    }

    public CheckReplicatedStatuses(
        actorId: string,
        statuses: StatusId[],
        ignoreList?: BlacklistedStatus[],
        customList?: ReplicatedStatus[],
    ): boolean {
        const list = customList ?? this.replicatedMap.get(actorId);

        if (!list) return false;

        return this.checkInternal(list, statuses, ignoreList);
    }

    public CheckStatuses(
        actorId: string,
        statuses: StatusId[],
        ignoreList?: BlacklistedStatus[],
    ): boolean {
        return (
            this.CheckClientStatuses(actorId, statuses, ignoreList) ||
            this.CheckReplicatedStatuses(actorId, statuses, ignoreList)
        );
    }

    private checkInternal(
        list: ReplicatedStatus[],
        statuses: StatusId[],
        ignoreList?: BlacklistedStatus[],
    ): boolean {
        for (const statusId of statuses) {
            const existing = list.find((status) => status.id === statusId);

            if (!existing) {
                continue;
            }

            const ignoreRule = ignoreList?.find((rule) => rule.id === existing.id);

            if (ignoreRule) {
                if (ignoreRule.maxPriority === undefined) {
                    continue;
                }

                if (existing.priority <= ignoreRule.maxPriority) {
                    continue;
                }
            }

            return true;
        }

        return false;
    }

    public Subscribe(
        actorId: string,
        statuses: {
            status: StatusId;
            event: ReplicatedStatusEvent;
        }[],
        callback: (event: ReplicatedStatusEvent, status: ReplicatedStatus) => void,
        name?: string,
    ) {
        if (!this.subscribers.has(actorId)) {
            this.subscribers.set(actorId, []);
        }

        const subs = this.subscribers.get(actorId)!;

        const data: Subscriber = {
            name,
            statuses,
            callback,
        };

        subs.push(data);

        return () => {
            if (name) {
                this.Unsubscribe(actorId, name);
            }
        };
    }

    public Unsubscribe(actorId: string, name: string) {
        const subs = this.subscribers.get(actorId);

        if (!subs) return;

        const index = subs.findIndex((sub) => sub.name === name);

        if (index !== -1) {
            subs.remove(index);
        }
    }

    private notify(actorId: string, event: ReplicatedStatusEvent, status: ReplicatedStatus) {
        const subs = this.subscribers.get(actorId);

        if (!subs) return;

        for (const sub of subs) {
            const found = sub.statuses.find((x) => x.status === status.id && x.event === event);

            if (found) {
                sub.callback(event, status);
            }
        }
    }

    private notifyChanged(actorId: string) {
        const replicated = this.replicatedMap.get(actorId) ?? [];
        const client = this.clientMap.get(actorId) ?? [];

        this.OnChanged?.(actorId, [...replicated, ...client]);
    }
}
