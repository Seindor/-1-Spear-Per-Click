import type { PipelineContext } from "shared/Domain/Pipeline/Aggregates/PipelineContext";
import { type SessionContext } from "shared/Types/Runtime/SessionRuntime";

import type { RuntimeAPI } from "shared/Domain/Runtime/API/RuntimeAPI";

import { Pipeline } from "shared/Domain/Pipeline/Decorators/Pipeline";
import { PipelineStep } from "shared/Domain/Pipeline/Aggregates/PipelineStep";

import { WeaponControllerToken } from "server/Implementation/Handlers/Runtimes/SessionRuntime/Controllers/RuntimeEquipment";

import { WeaponController } from "server/Implementation/Handlers/Runtimes/SessionRuntime/Controllers/RuntimeEquipment/WeaponController";

import { CompositionRootShared } from "shared/DI/CompositionRootShared";
import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { GameContext, GamePipelineToken } from "../../GamePipeline";

const sharedScope = CompositionRootShared.createScope();

const runtimeAPI = sharedScope.resolve(
    SharedRegistry.Singletons.API.RuntimeAPI,
) as RuntimeAPI<SessionContext>;

@Pipeline({ Pipeline: GamePipelineToken })
export class RuntimeEquipmentControllersRegistryStep extends PipelineStep<GameContext> {
    public readonly Id = `RuntimeEquipmentControllersRegistryStep`;

    public Execute(ctx: PipelineContext<GameContext>): void {
        const { id } = ctx.Data;

        runtimeAPI.Register(`Equipment`, WeaponControllerToken, WeaponController);

        ctx.MarkCompleted(this.Id);
    }
}
