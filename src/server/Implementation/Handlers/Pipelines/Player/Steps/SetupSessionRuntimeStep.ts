import type { PipelineContext } from "shared/Domain/Pipeline/Aggregates/PipelineContext";
import { PlayerPipelineToken, type PlayerContext } from "../PlayerPipeline";
import { type SessionContext } from "shared/Types/Runtime/SessionRuntime";

import type { RuntimeAPI } from "shared/Domain/Runtime/API/RuntimeAPI";
import type { ServerReplicatedAtomAPI } from "shared/Domain/ReplicatedAtoms/API/ServerReplicatedAtomAPI";

import { Pipeline } from "shared/Domain/Pipeline/Decorators/Pipeline";

import { PipelineStep } from "shared/Domain/Pipeline/Aggregates/PipelineStep";

import { CompositionRootShared } from "shared/DI/CompositionRootShared";
import { CompositionRootServer } from "server/DI/CompositionRootServer";
import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { ServerRegistry } from "server/DI/Generated/ServerRegistry";
import { IsPlaceBlacklisted, PlaceBlacklist } from "shared/Types/Game/ServerInfo";
import {
    HealthControllerToken,
    RuntimeStatsControllers,
} from "server/Implementation/Handlers/Runtimes/SessionRuntime/Controllers/RuntimeStats";
import {
    RuntimeEquipmentControllers,
    WeaponControllerToken,
} from "server/Implementation/Handlers/Runtimes/SessionRuntime/Controllers/RuntimeEquipment";

const sharedScope = CompositionRootShared.createScope();
const serverScope = CompositionRootServer.createScope();

const runtimeAPI = sharedScope.resolve(
    SharedRegistry.Singletons.API.RuntimeAPI,
) as RuntimeAPI<SessionContext>;

const serverReplicatedAtomAPI = serverScope.resolve(
    ServerRegistry.Singletons.API.ServerAtomAPI,
) as ServerReplicatedAtomAPI;

@Pipeline({ Pipeline: PlayerPipelineToken })
export class SetupSessionRuntime extends PipelineStep<PlayerContext> {
    public readonly Id = `SetupSessionRuntimeStep`;
    public readonly After = [`LoadDataStep`];
    public blacklist = [`Main Menu`] as PlaceBlacklist;

    public Execute(ctx: PipelineContext<PlayerContext>): void {
        const { id, player } = ctx.Data;

        if (IsPlaceBlacklisted(this.blacklist)) return;

        const runtimeStats = runtimeAPI.Get<RuntimeStatsControllers>(id, `Stats`)!;

        const runtimeEquipment = runtimeAPI.Get<RuntimeEquipmentControllers>(id, `Equipment`)!;

        runtimeStats.Get(HealthControllerToken);

        runtimeEquipment.Get(WeaponControllerToken);

        ctx.MarkCompleted(this.Id);
    }
}
