import { PipelineContext } from "shared/Domain/Pipeline/Aggregates/PipelineContext";
import { ClientPlayerContext } from "shared/Types/Pipelines/ClientsPlayer/ClientPlayerPipeline";

import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";

const sharedScope = CompositionRootShared.createScope();

const clientAtomAPI = sharedScope.resolve(SharedRegistry.Singletons.API.ClientAtomAPI);

export class Replicators {
    public playerData: PlayerData | undefined;

    constructor(ctx: PipelineContext<ClientPlayerContext>) {
        clientAtomAPI.Subscribe<Record<string, PlayerData>, PlayerData>(
            ctx.Data.id,
            `Replicators/PlayerData`,
            `PlayerData`,
            `${ctx.Data.id}`,
            (playerData) => {
                this.playerData = playerData;
            },
        );
    }
}
