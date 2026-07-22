import { ReplicatedAtomAggregate } from "shared/Domain/ReplicatedAtoms/Aggregates/ReplicatedAtomAggregate";
import { RegisterReplicator } from "shared/Domain/ReplicatedAtoms/Decorators/RegisterReplicator";

import { PlayerData } from "shared/Types/Database/PlayerData";
import { AtomPath, AtomPathValue } from "shared/Domain/ReplicatedAtoms_OLD/Types/AtomPathTypes";

import { ServerRegistry } from "server/DI/Generated/ServerRegistry";
import { CompositionRootServer } from "server/DI/CompositionRootServer";
import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";

const serverScope = CompositionRootServer.createScope();
const sharedScope = CompositionRootShared.createScope();

const serverAtomAPI = serverScope.resolve(ServerRegistry.Singletons.API.ServerAtomAPI);
const eventBusAPI = sharedScope.resolve(SharedRegistry.Singletons.API.EventBusAPI);

@RegisterReplicator()
export class PlayerDataReplicator extends ReplicatedAtomAggregate<PlayerData> {
    constructor() {
        super(`PlayerData`, {} as PlayerData);
    }

    public InitActor(actorId: string, data: PlayerData) {
        this.Set(actorId as never, data as never);

        const playerDataBus = eventBusAPI.New(actorId, `PlayerData`);

        playerDataBus.Subscribe(
            `SyncReplicators`,
            () => {
                this.UpdateData(actorId, data);
            },
            undefined,
            `PlayerDataReplicator`,
        );
    }

    public UpdateDataWithPath(playerId: string) {
        return {
            Set: <TPath extends AtomPath<PlayerData>>(
                path: TPath,
                value: AtomPathValue<PlayerData, TPath>,
            ) => {
                this.Set(`${playerId}/${path}` as never, value as never);
            },
        };
    }

    public UpdateData(acotrId: string, data: PlayerData) {
        this.Set(`${acotrId}` as never, data as never);
    }
}
