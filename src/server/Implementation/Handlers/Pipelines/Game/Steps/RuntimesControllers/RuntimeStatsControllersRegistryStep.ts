import type { PipelineContext } from "shared/Domain/Pipeline/Aggregates/PipelineContext";
import { type SessionContext } from "shared/Types/Runtime/SessionRuntime";

import type { RuntimeAPI } from "shared/Domain/Runtime/API/RuntimeAPI";

import { Pipeline } from "shared/Domain/Pipeline/Decorators/Pipeline";
import { PipelineStep } from "shared/Domain/Pipeline/Aggregates/PipelineStep";
import { GameContext, GamePipelineToken } from "../../GamePipeline";

import {
    StrengthControllerToken,
    WinsControllerToken,
} from "server/Implementation/Handlers/Runtimes/SessionRuntime/Controllers/RuntimeStats";
import { StrengthController } from "server/Implementation/Handlers/Runtimes/SessionRuntime/Controllers/RuntimeStats/StrengthController";

import { CompositionRootShared } from "shared/DI/CompositionRootShared";
import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { WinsController } from "server/Implementation/Handlers/Runtimes/SessionRuntime/Controllers/RuntimeStats/WinsController";

const sharedScope = CompositionRootShared.createScope();

const runtimeAPI = sharedScope.resolve(
    SharedRegistry.Singletons.API.RuntimeAPI,
) as RuntimeAPI<SessionContext>;

@Pipeline({ Pipeline: GamePipelineToken })
export class RuntimeStatsControllersRegistryStep extends PipelineStep<GameContext> {
    public readonly Id = `RuntimeStatsControllersRegistryStep`;

    public Execute(ctx: PipelineContext<GameContext>): void {
        const { id } = ctx.Data;

        runtimeAPI.Register(`Stats`, StrengthControllerToken, StrengthController);
        runtimeAPI.Register(`Stats`, WinsControllerToken, WinsController);

        ctx.MarkCompleted(this.Id);
    }
}
