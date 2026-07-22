import { Workspace, RunService } from "@rbxts/services";
import { StatusAggregate } from "../Aggregates/StatusAggregate";
import { BlacklistedStatus, StackInstance, StatusAggregateOptions } from "../Types/StatusTypes";
import { IStatusId as StatusId } from "../Types/StatusTypes";
import { Janitor } from "@rbxts/janitor";

export class StatusEffectsService {
    private readonly statusEffectsMap = new Map<string, StatusAggregate[]>();
    private readonly subscriptions = new Map<
        string,
        Array<{
            name?: string;
            statuses:
                | {
                      status: StatusId;
                      event: "Added" | "Removed";
                  }[]
                | "All";
            callback: (event: "Added" | "Removed", status: StatusAggregate) => void;
        }>
    >();
    private readonly _Janitor = new Janitor<any>();

    constructor() {
        const ValidateDurations = RunService.Heartbeat.Connect(() => {
            this.ValidateDurations();
        });
        this._Janitor.Add(ValidateDurations, "Disconnect", "ValidateDurations");
    }

    public InitActor(actorId: string) {
        if (this.statusEffectsMap.has(actorId)) {
            warn(`Overwrited StatusEffects for ${actorId}.`);
            this.statusEffectsMap.delete(actorId);
        }
        this.statusEffectsMap.set(actorId, []);
    }

    public EnsureActor(actorId: string): StatusAggregate[] {
        if (!this.statusEffectsMap.has(actorId)) {
            this.statusEffectsMap.set(actorId, []);
        }
        return this.statusEffectsMap.get(actorId)!;
    }

    public OnChanged?: (actorId: string, statuses: StatusAggregate[]) => void;

    private notifySubscriptions(
        actorId: string,
        event: "Added" | "Removed",
        status: StatusAggregate,
    ) {
        const subscriptions = this.subscriptions.get(actorId);

        if (!subscriptions) return;

        for (const sub of subscriptions) {
            if (sub.statuses === "All") {
                sub.callback(event, status);
                continue;
            }

            const found = sub.statuses.find((x) => x.status === status.id && x.event === event);

            if (found) {
                sub.callback(event, status);
            }
        }
    }

    private notify(actorId: string) {
        const statuses = this.statusEffectsMap.get(actorId) ?? [];
        this.OnChanged?.(actorId, statuses);
    }

    private ValidateDurations() {
        const now = Workspace.GetServerTimeNow();

        for (const [actorId, statuses] of this.statusEffectsMap) {
            for (let i = statuses.size() - 1; i >= 0; i--) {
                const status = statuses[i];

                if (status.stackBehavior === "IndependentStacks") {
                    if (!status.stackInstances) continue;

                    for (let j = status.stackInstances.size() - 1; j >= 0; j--) {
                        const stack = status.stackInstances[j];

                        if (now - stack.spawned >= stack.duration) {
                            status.stackInstances.remove(j);
                            status.stacks!--; // если используешь счетчик
                        }
                    }

                    // агрегат живет, пока есть хотя бы один стек
                    if (status.stackInstances.size() === 0) {
                        this.RemoveStatus(actorId, status.id);
                    }
                } else {
                    if (status.duration !== undefined && now - status.spawned >= status.duration) {
                        this.RemoveStatus(actorId, status.id);
                    }
                }
            }
        }
    }

    private canApplyStatus(actorId: string, incoming: StatusAggregate): boolean {
        const list = this.statusEffectsMap.get(actorId);
        if (!list) return true;

        const incomingId = incoming.id as StatusId;
        const incomingPriority = incoming.priority ?? 1;

        for (const existing of list) {
            const existingId = existing.id as StatusId;

            const blockRule = existing.blacklist?.find((r) => r.id === incomingId);

            if (blockRule) {
                const ignoreExistingRule = incoming.ignoreList?.find((r) => r.id === existingId);

                if (ignoreExistingRule) {
                    if (ignoreExistingRule.maxPriority === undefined) {
                        continue;
                    }

                    if (existing.priority <= ignoreExistingRule.maxPriority) {
                        continue;
                    }
                }

                if (blockRule.maxPriority === undefined) {
                    return false;
                }

                if (incomingPriority <= blockRule.maxPriority) {
                    return false;
                }
            }
        }

        return true;
    }

    public CreateStatus(
        statusName: StatusId,
        options?: StatusAggregateOptions,
        autoAdd?: boolean,
        actorId?: string,
    ): StatusAggregate {
        const status = new StatusAggregate(statusName, options ?? undefined);

        if (autoAdd) {
            if (!actorId) {
                warn(`actorId is nil, ${statusName} not added!`);
            } else {
                return this.AddStatus(actorId, status, options?.stack);
            }
        }

        return status;
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
        name?: string,
    ) {
        if (!this.subscriptions.has(actorId)) {
            this.subscriptions.set(actorId, []);
        }

        const subs = this.subscriptions.get(actorId)!;

        const data = {
            name,
            statuses,
            callback,
        };

        subs.push(data);

        return () => {
            const index = subs.indexOf(data);

            if (index !== -1) {
                subs.remove(index);
            }
        };
    }

    public Unsubscribe(actorId: string, name: string) {
        const subs = this.subscriptions.get(actorId);

        if (!subs) return;

        const index = subs.findIndex((sub) => sub.name === name);

        if (index !== -1) {
            subs.remove(index);
        }
    }

    public HasStatus(actorId: string, statusId: StatusId): boolean {
        const list = this.statusEffectsMap.get(actorId);

        if (!list) {
            return false;
        }

        return list.some((status) => status.id === statusId);
    }

    private policyRefresh(actorId: string, newStatus: StatusAggregate): StatusAggregate {
        const list = this.statusEffectsMap.get(actorId)!;

        const existinIndex = list.findIndex((status) => status.id === newStatus.id);

        if (existinIndex !== -1) {
            const existing = list[existinIndex];
            if (existing.priority < newStatus.priority) {
                existing.duration = newStatus.duration ?? existing.duration;
                existing.spawned = Workspace.GetServerTimeNow();
            } else if (existing.priority === newStatus.priority) {
                existing.duration = newStatus.duration;
                existing.spawned = Workspace.GetServerTimeNow();
            }

            existing.apply(actorId);
            return existing;
        } else {
            list.push(newStatus);
            newStatus.add(actorId);
            newStatus.apply(actorId);
            return newStatus;
        }
    }

    private policyAdd(actorId: string, newStatus: StatusAggregate, stack?: StackInstance) {
        const list = this.statusEffectsMap.get(actorId)!;
        const existingIndex = list.findIndex((status) => status.id === newStatus.id);
        const now = Workspace.GetServerTimeNow();

        if (existingIndex !== -1) {
            const existing = list[existingIndex];
            if (existing.maxStacks && existing.stacks! >= existing.maxStacks) {
                if (existing.stackBehavior === "Cycle") {
                    existing.stacks = 0;
                } else {
                    return existing;
                }
            }

            switch (existing.stackBehavior) {
                case "RefreshDuration":
                    existing.stacks! += 1;
                    existing.spawned = now;
                    break;

                case "KeepDuration":
                    existing.stacks! += 1;
                    break;

                case "Cycle":
                    existing.stacks! += 1;
                    existing.spawned = now;
                    break;

                case "IndependentStacks":
                    if (!stack) {
                        warn(`Stack is nil for ${newStatus.id}, stacks not updated.`);
                        return newStatus;
                    }

                    existing.stacks! += 1;

                    if (!existing.stackInstances) {
                        existing.stackInstances = [];
                    }

                    existing.stackInstances.push(stack!);

                    if (existing.onApply) {
                        existing.onApply(actorId, existing);
                    }

                    break;
            }
            return existing;
        } else {
            list.push(newStatus);

            if (newStatus.stackBehavior === "IndependentStacks") {
                newStatus.stackInstances = [];
                newStatus.stackInstances.push(stack!);
            }

            newStatus.add(actorId);
            newStatus.apply(actorId);
            return newStatus;
        }
    }

    private policyIgnore(actorId: string, newStatus: StatusAggregate): StatusAggregate {
        const list = this.statusEffectsMap.get(actorId)!;

        const existinIndex = list.findIndex((status) => status.id === newStatus.id);

        if (existinIndex === -1) {
            list.push(newStatus);
            newStatus.add(actorId);
            newStatus.apply(actorId);
            return newStatus;
        } else {
            return list[existinIndex];
        }
    }

    private policyReplace(actorId: string, newStatus: StatusAggregate): StatusAggregate {
        const list = this.statusEffectsMap.get(actorId)!;
        const existingIndex = list.findIndex((status) => status.id === newStatus.id);

        if (existingIndex === -1) {
            list.push(newStatus);
            newStatus.add(actorId);
            newStatus.apply(actorId);
            return newStatus;
        }

        const existing = list[existingIndex];

        if (newStatus.priority > existing.priority) {
            existing.remove(actorId);
            list[existingIndex] = newStatus;
            newStatus.apply(actorId);
            return newStatus;
        }

        if (newStatus.priority < existing.priority) {
            return existing;
        }

        const now = Workspace.GetServerTimeNow();

        const oldRemaining =
            existing.duration !== undefined
                ? existing.spawned + existing.duration - now
                : math.huge;

        const newRemaining = newStatus.duration !== undefined ? newStatus.duration : math.huge;

        if (newRemaining > oldRemaining) {
            existing.remove(actorId);
            list[existingIndex] = newStatus;
            newStatus.apply(actorId);
            return newStatus;
        }

        return existing;
    }

    public AddStatus(
        actorId: string,
        newStatus: StatusAggregate,
        stack?: StackInstance,
    ): StatusAggregate {
        this.EnsureActor(actorId);

        if (!this.canApplyStatus(actorId, newStatus)) {
            return newStatus;
        }

        const list = this.statusEffectsMap.get(actorId)!;

        const existedBefore = list.some((s) => s.id === newStatus.id);

        const result = this[`policy${newStatus.stackingPolicy}`](
            actorId,
            newStatus,
            stack ?? undefined,
        )!;

        const existsAfter = this.statusEffectsMap.get(actorId)!.some((s) => s.id === result.id);

        if (!existedBefore && existsAfter) {
            this.notifySubscriptions(actorId, "Added", result);
        }

        this.OnChanged?.(actorId, list);
        return result;
    }

    public GetStatuses(actorId: string): StatusAggregate[] | undefined {
        const list = this.statusEffectsMap.get(actorId);

        if (!list) {
            return undefined;
        }

        return list;
    }

    public GetStatus(actorId: string, statusName: StatusId): StatusAggregate | undefined {
        const list = this.statusEffectsMap.get(actorId);

        if (!list) return;

        const index = list.findIndex((status) => status.id === statusName);

        if (index === -1) return;

        return list[index];
    }

    public RemoveStatus(actorId: string, statusName: StatusId) {
        const list = this.statusEffectsMap.get(actorId);

        if (!list) return;

        const index = list.findIndex((status) => status.id === statusName);

        if (index === -1) return;

        const removed = list[index];

        removed.remove(actorId);
        list.remove(index);

        this.OnChanged?.(actorId, list);
        this.notifySubscriptions(actorId, "Removed", removed);
    }

    public RemoveAllStatuses(actorId: string) {
        const list = this.statusEffectsMap.get(actorId);

        if (!list) {
            warn(`Cannot find map for ${actorId}, statuses not removed.`);
            return;
        }

        for (let i = list.size() - 1; i >= 0; i--) {
            const status = list[i];

            status.remove(actorId);

            this.notifySubscriptions(actorId, "Removed", status);

            list.remove(i);
        }

        this.OnChanged?.(actorId, list);
        this.notify(actorId);
    }

    public CheckStatuses(
        actorId: string,
        statuses: StatusId[],
        ignoreList?: BlacklistedStatus[],
        customList?: StatusAggregate[],
    ): boolean {
        const list = customList ?? this.statusEffectsMap.get(actorId);

        if (!list) {
            warn(`Cannot find map for ${actorId}`);
            return false;
        }

        for (const statusId of statuses) {
            const existing = list.find((status) => status.id === statusId);

            if (!existing) {
                continue;
            }

            existing.check(actorId);

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
}
