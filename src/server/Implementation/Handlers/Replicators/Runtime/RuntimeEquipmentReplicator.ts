import { ReplicatedAtomAggregate } from "shared/Domain/ReplicatedAtoms/Aggregates/ReplicatedAtomAggregate";
import { RegisterReplicator } from "shared/Domain/ReplicatedAtoms/Decorators/RegisterReplicator";

import { AtomPath, AtomPathValue } from "shared/Domain/ReplicatedAtoms_OLD/Types/AtomPathTypes";

import { RuntimeEquipmentState } from "shared/Types/Replicators/Runtime/RuntimeEquipmentState";

import { ServerRegistry } from "server/DI/Generated/ServerRegistry";
import { CompositionRootServer } from "server/DI/CompositionRootServer";

const serverScope = CompositionRootServer.createScope();

const serverAtomAPI = serverScope.resolve(ServerRegistry.Singletons.API.ServerAtomAPI);

@RegisterReplicator()
export class RuntimeEquipmentReplicator extends ReplicatedAtomAggregate<
    Record<string, RuntimeEquipmentState>
> {
    constructor() {
        super("RuntimeEquipment", {});
    }

    public InitActor(actorId: string) {
        this.UpdateActor(actorId, {
            flags: {
                fightingStyle: `none`,
                weapon: `none`,
                currentStage: `Stage_1`,
            },
            equipment: {},
        });
    }

    public UpdateDataWithPath(playerId: string) {
        return {
            Set: <TPath extends AtomPath<RuntimeEquipmentState>>(
                path: TPath,
                value: AtomPathValue<RuntimeEquipmentState, TPath>,
            ) => {
                this.Set(`${playerId}/${path}` as never, value as never);
            },
        };
    }

    public UpdateActor(id: string, data: RuntimeEquipmentState) {
        this.Set(`${id}` as never, data as never);
    }

    public ClearActor(id: string): void {
        this.Remove(id);
    }
}
