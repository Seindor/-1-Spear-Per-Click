import type { PipelineContext } from "shared/Domain/Pipeline/Aggregates/PipelineContext";
import { PlayerPipelineToken, type PlayerContext } from "../PlayerPipeline";
import { type SessionContext } from "shared/Types/Runtime/SessionRuntime";

import { DataHandler } from "server/Implementation/Handlers/Game/Data/DataHandler";
import type { RuntimeAPI } from "shared/Domain/Runtime/API/RuntimeAPI";
import type { ServerReplicatedAtomAPI } from "shared/Domain/ReplicatedAtoms/API/ServerReplicatedAtomAPI";

import { Pipeline } from "shared/Domain/Pipeline/Decorators/Pipeline";

import { PipelineStep } from "shared/Domain/Pipeline/Aggregates/PipelineStep";

import { CompositionRootShared } from "shared/DI/CompositionRootShared";
import { CompositionRootServer } from "server/DI/CompositionRootServer";
import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { ServerRegistry } from "server/DI/Generated/ServerRegistry";
import { IsPlaceBlacklisted, PlaceBlacklist } from "shared/Types/Game/ServerInfo";
import { RuntimeStatsControllers } from "server/Implementation/Handlers/Runtimes/SessionRuntime/Controllers/RuntimeStats";
import { RuntimeEquipmentControllers } from "server/Implementation/Handlers/Runtimes/SessionRuntime/Controllers/RuntimeEquipment";
import { RuntimeGamePlayControllers } from "server/Implementation/Handlers/Runtimes/SessionRuntime/Controllers/RuntimeGameplay";

const sharedScope = CompositionRootShared.createScope();
const serverScope = CompositionRootServer.createScope();

const runtimeAPI = sharedScope.resolve(
    SharedRegistry.Singletons.API.RuntimeAPI,
) as RuntimeAPI<SessionContext>;

const serverReplicatedAtomAPI = serverScope.resolve(
    ServerRegistry.Singletons.API.ServerAtomAPI,
) as ServerReplicatedAtomAPI;

@Pipeline({ Pipeline: PlayerPipelineToken })
export class LoadDataStep extends PipelineStep<PlayerContext> {
    public readonly Id = `LoadDataStep`;

    public Execute(ctx: PipelineContext<PlayerContext>): void {
        const { id, player } = ctx.Data;

        const handler = new DataHandler(player);
        if (!handler.Load()) error(`[LoadDataStep] Failed for ${id}`);

        let data = handler.GetData();

        const runtimeStats = runtimeAPI.Create<RuntimeStatsControllers>({ id }, `Stats`);
        runtimeStats.SetMeta(`DataHandler`, handler);

        const runtimeEquipment = runtimeAPI.Create<RuntimeEquipmentControllers>(
            { id },
            `Equipment`,
        );
        runtimeEquipment.SetMeta(`DataHandler`, handler);

        const runtimeGamePlay = runtimeAPI.Create<RuntimeGamePlayControllers>({ id }, `GamePlay`);
        runtimeGamePlay.SetMeta(`DataHandler`, handler);

        ctx.Set(`DataHandler`, handler);

        ctx.MarkCompleted(this.Id);
    }
}
