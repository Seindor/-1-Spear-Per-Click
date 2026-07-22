import { ReplicatedAtomAggregate } from "shared/Domain/ReplicatedAtoms/Aggregates/ReplicatedAtomAggregate";
import { RegisterReplicator } from "shared/Domain/ReplicatedAtoms/Decorators/RegisterReplicator";

import { AtomPath, AtomPathValue } from "shared/Domain/ReplicatedAtoms_OLD/Types/AtomPathTypes";

import { RuntimeEquipmentState } from "shared/Types/Replicators/Runtime/RuntimeEquipmentState";

import { ServerRegistry } from "server/DI/Generated/ServerRegistry";
import { CompositionRootServer } from "server/DI/CompositionRootServer";
import { RuntimeStatsState } from "shared/Types/Replicators/Runtime/RuntimeStatsState";

const serverScope = CompositionRootServer.createScope();

const serverAtomAPI = serverScope.resolve(ServerRegistry.Singletons.API.ServerAtomAPI);

@RegisterReplicator()
export class RuntimeStatsReplicator extends ReplicatedAtomAggregate<
    Record<string, RuntimeStatsReplicator>
> {
    constructor() {
        super("RuntimeStats", {});
    }

    public InitActor(actorId: string, data: RuntimeStatsState) {
        this.UpdateActor(actorId, data);
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
