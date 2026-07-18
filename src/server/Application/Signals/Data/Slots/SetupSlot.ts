import { OnStart, Service } from "@flamework/core";
import { ServerSignals } from "shared/Implementation/Entities/SerrverSignals";

import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";
import { PlayerPipelineToken } from "server/Implementation/Handlers/Pipelines/Player/PlayerPipeline";

import type { DataHandler } from "server/Implementation/Handlers/DataHandler";

const sharedScope = CompositionRootShared.createScope();

const pipelineAPI = sharedScope.resolve(SharedRegistry.Singletons.API.PipelineAPI);

@Service()
export class SetupSlot implements OnStart {
    onStart(): void {
        ServerSignals.SetupSlot.connect((player, slotId, name, gender, race) => {
            const playerCtx = pipelineAPI.GetContext(PlayerPipelineToken, tostring(player.UserId));

            if (!playerCtx || !playerCtx.IsFinished()) {
                warn(`[SetupSlot] Player pipeline for ${player.Name} is not finished yet`);
                return;
            }

            const dataHandler = playerCtx.Get<DataHandler>("DataHandler");

            if (!dataHandler) {
                warn(`[SetupSlot] Player data is nil.`);
                return;
            }

            dataHandler.SetupSlot(slotId, name, gender, race);
        });
    }
}
