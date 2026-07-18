import { ReplicatedAtomAggregate } from "shared/Domain/ReplicatedAtoms/Aggregates/ReplicatedAtomAggregate";
import { RegisterReplicator } from "shared/Domain/ReplicatedAtoms/Decorators/RegisterReplicator";

import { ServerRegistry } from "server/DI/Generated/ServerRegistry";
import { CompositionRootServer } from "server/DI/CompositionRootServer";
import { RuntimeStatsState } from "shared/Types/Replicators/Runtime/RuntimeStatsState";
import { AtomPath, AtomPathValue } from "shared/Domain/ReplicatedAtoms_OLD/Types/AtomPathTypes";

const serverScope = CompositionRootServer.createScope();

const serverAtomAPI = serverScope.resolve(ServerRegistry.Singletons.API.ServerAtomAPI);

@RegisterReplicator()
export class RuntimeStatsReplicator extends ReplicatedAtomAggregate<
    Record<string, RuntimeStatsState>
> {
    constructor() {
        super("RuntimeStats", {});
    }

    public InitActor(actorId: string) {
        this.UpdateActor(actorId, {
            health: { value: 100, maxValue: 100 },
            posture: { value: 100, maxValue: 100 },
            hunger: { value: 100, maxValue: 100 },
        });
    }

    public UpdateDataWithPath(playerId: string) {
        return {
            Set: <TPath extends AtomPath<RuntimeStatsState>>(
                path: TPath,
                value: AtomPathValue<RuntimeStatsState, TPath>,
            ) => {
                this.Set(`${playerId}/${path}` as never, value as never);
            },
        };
    }

    public UpdateActor(id: string, data: RuntimeStatsState) {
        this.Set(`${id}` as never, data as never);
    }

    public ClearActor(id: string): void {
        this.Remove(id);
    }
}
