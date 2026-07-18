import type { PipelineContext } from "shared/Domain/Pipeline/Aggregates/PipelineContext";
import { type SessionContext } from "shared/Types/Runtime/SessionRuntime";

import type { RuntimeAPI } from "shared/Domain/Runtime/API/RuntimeAPI";

import { GameContext, GamePipelineToken } from "../../GamePipeline";
import { Pipeline } from "shared/Domain/Pipeline/Decorators/Pipeline";
import { PipelineStep } from "shared/Domain/Pipeline/Aggregates/PipelineStep";

import { ServerSignals } from "shared/Implementation/Entities/SerrverSignals";

import { CompositionRootServer } from "server/DI/CompositionRootServer";
import { ServerRegistry } from "server/DI/Generated/ServerRegistry";

const serverScope = CompositionRootServer.createScope();

const serverAtomAPI = serverScope.resolve(ServerRegistry.Singletons.API.ServerAtomAPI);

@Pipeline({ Pipeline: GamePipelineToken })
export class AtomsSetupStep extends PipelineStep<GameContext> {
    public readonly Id = `AtomsSetupStep`;

    public Execute(ctx: PipelineContext<GameContext>): void {
        const { id } = ctx.Data;

        serverAtomAPI.SetSendCallback((player, payload) => {
            ServerSignals.AtomSync.fire(player, payload);
        });

        serverAtomAPI.Init();

        ctx.MarkCompleted(this.Id);
    }
}
