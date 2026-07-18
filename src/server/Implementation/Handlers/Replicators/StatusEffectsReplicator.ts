import { ReplicatedAtomAggregate } from "shared/Domain/ReplicatedAtoms/Aggregates/ReplicatedAtomAggregate";
import { RegisterReplicator } from "shared/Domain/ReplicatedAtoms/Decorators/RegisterReplicator";
import { ReplicatedStatus, StatusEffectsState } from "shared/Types/GlobalStatusEffectsTypes";

import { ServerRegistry } from "server/DI/Generated/ServerRegistry";
import { CompositionRootServer } from "server/DI/CompositionRootServer";
import { StatusAggregate } from "shared/Domain/StatusEffects/Aggregates/StatusAggregate";
import { push } from "@rbxts/sift/out/Array";

const serverScope = CompositionRootServer.createScope();

const statusEffectsAPI = serverScope.resolve(ServerRegistry.Singletons.API.StatusEffectsAPI);

@RegisterReplicator()
export class StatusEffectsReplicator extends ReplicatedAtomAggregate<StatusEffectsState> {
    constructor() {
        super(`StatusEffects`, {});
    }

    public InitActor(actorId: string) {
        this.SetStatuses(actorId, [] as never);
        this.Sync(actorId);

        task.delay(5, () => {
            statusEffectsAPI.CreateStatus(`Test`, undefined, true, actorId);
        });
    }

    public SyncOld(actorId: string) {
        statusEffectsAPI.service.OnChanged = (_actorId: string, statuses: StatusAggregate[]) => {
            const replicated: ReplicatedStatus[] = statuses.map((s) => ({
                id: s.id,
                priority: s.priority,
                spawned: s.spawned,
                duration: s.duration,
                stacks: s.stacks,
                stackBehavior: s.stackBehavior,
                tags: s.tags,
                miscData: s.miscData,
            }));

            this.SetStatuses(_actorId, replicated);
        };
    }

    public Sync(actorId: string) {
        statusEffectsAPI.Subscribe(
            actorId,
            `All`,
            (event, status) => {
                const replicatedStatus: ReplicatedStatus = {
                    id: status.id,
                    priority: status.priority,
                    spawned: status.spawned,
                    duration: status.duration,
                    stacks: status.stacks,
                    stackBehavior: status.stackBehavior,
                    tags: status.tags,
                    miscData: status.miscData,
                };

                this.Mutate((state) => {
                    const actorStatuses = state[actorId] ?? [];

                    const index = actorStatuses.findIndex((s) => s.id === replicatedStatus.id);

                    if (event === "Added") {
                        if (index !== -1) {
                            const updated = [...actorStatuses];
                            updated[index] = replicatedStatus;

                            return {
                                ...state,
                                [actorId]: updated,
                            };
                        }

                        return {
                            ...state,
                            [actorId]: [...actorStatuses, replicatedStatus],
                        };
                    }

                    if (event === "Removed") {
                        if (index !== -1) {
                            const updated = [...actorStatuses];
                            updated.remove(index);

                            return {
                                ...state,
                                [actorId]: updated,
                            };
                        }
                    }

                    return state;
                });
            },
            `StatusEffectsReplicator`,
        );
    }

    public SetStatuses(actorId: string, statuses: ReplicatedStatus[]) {
        this.SetState({ ...this.GetState(), [actorId]: statuses });
    }
}
