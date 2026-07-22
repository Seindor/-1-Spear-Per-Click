import { ReplicatedAtomAggregate } from "shared/Domain/ReplicatedAtoms/Aggregates/ReplicatedAtomAggregate";
import { RegisterReplicator } from "shared/Domain/ReplicatedAtoms/Decorators/RegisterReplicator";

import { AtomPath, AtomPathValue } from "shared/Domain/ReplicatedAtoms_OLD/Types/AtomPathTypes";

import { RuntimeGamePlayState } from "shared/Types/Replicators/Runtime/RuntimeGameplayState";

import { ServerRegistry } from "server/DI/Generated/ServerRegistry";
import { CompositionRootServer } from "server/DI/CompositionRootServer";

const serverScope = CompositionRootServer.createScope();

const serverAtomAPI = serverScope.resolve(ServerRegistry.Singletons.API.ServerAtomAPI);

@RegisterReplicator()
export class RuntimeGamePlayReplicator extends ReplicatedAtomAggregate<
    Record<string, RuntimeGamePlayState>
> {
    constructor() {
        super("RuntimeGamePlay", {});
    }

    public InitActor(actorId: string) {
        this.UpdateActor(actorId, {
            World: {
                id: 1,
                rooms: [],
                completedRooms: [],
            },
        });
    }

    public UpdateDataWithPath(playerId: string) {
        return {
            Set: <TPath extends AtomPath<RuntimeGamePlayState>>(
                path: TPath,
                value: AtomPathValue<RuntimeGamePlayState, TPath>,
            ) => {
                this.Set(`${playerId}/${path}` as never, value as never);
            },
        };
    }

    public UpdateActor(id: string, data: RuntimeGamePlayState) {
        this.Set(`${id}` as never, data as never);
    }

    public ClearActor(id: string): void {
        this.Remove(id);
    }
}
