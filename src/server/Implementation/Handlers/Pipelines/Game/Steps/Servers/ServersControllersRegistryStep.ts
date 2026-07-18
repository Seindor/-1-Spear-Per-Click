import { RunService, TeleportService } from "@rbxts/services";

import { GameContext, GamePipelineToken } from "../../GamePipeline";
import { PipelineContext } from "shared/Domain/Pipeline/Aggregates/PipelineContext";
import { PipelineStep } from "shared/Domain/Pipeline/Aggregates/PipelineStep";
import { Pipeline } from "shared/Domain/Pipeline/Decorators/Pipeline";

import { RuntimeAPI } from "shared/Domain/Runtime/API/RuntimeAPI";
import { ServerContext } from "shared/Types/Runtime/ServerRuntime";

import { ServersController } from "server/Implementation/Handlers/Runtimes/ServersRuntime/Controllers/ServersController";
import { ServersControllers } from "server/Implementation/Handlers/Runtimes/ServersRuntime/ServersControllers";

import { ServersControllerToken } from "server/Implementation/Handlers/Runtimes/ServersRuntime/ServersRuntimeToken";

import { CompositionRootShared } from "shared/DI/CompositionRootShared";
import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { GameTeleportData } from "shared/Types/Game/TeleportDatas/TeleportData";
import { ServerSignals } from "shared/Implementation/Entities/SerrverSignals";
import { PlaceNames } from "shared/Types/Game/ServerInfo";

const sharedScope = CompositionRootShared.createScope();

const runtimeAPI = sharedScope.resolve(
    SharedRegistry.Singletons.API.RuntimeAPI,
) as RuntimeAPI<ServerContext>;

const eventBusAPI = sharedScope.resolve(SharedRegistry.Singletons.API.EventBusAPI);

@Pipeline({ Pipeline: GamePipelineToken })
export class ServersControllersRegistryStep extends PipelineStep<GameContext> {
    public readonly Id = `ServersControllersRegistryStep`;

    public blacklist = [`Main Menu`];

    public Execute(ctx: PipelineContext<GameContext>): void {
        const { id } = ctx.Data;
        const serversBus = eventBusAPI.New(`Game`, `Servers`);

        const serversRuntime = runtimeAPI.Create<ServersControllers>({ id: `Game` }, `Servers`);

        runtimeAPI.Register(`Servers`, ServersControllerToken, ServersController);

        let teleportData = undefined as undefined | GameTeleportData;

        serversBus.Once(`Player/TeleportData`, (recievedTeleportData: GameTeleportData) => {
            teleportData = recievedTeleportData;
            serversRuntime.SetMeta(`TeleportData`, teleportData);
        });

        if (!this.CheckBlacklist) {
            while (!teleportData) {
                task.wait(1);
            }
        }

        serversRuntime.Get(ServersControllerToken);

        ctx.MarkCompleted(this.Id);
    }

    public CheckBlacklist(): boolean {
        const placeId = game.PlaceId;
        const placeName = PlaceNames[placeId as keyof typeof PlaceNames];

        if (RunService.IsStudio()) return true;

        if (this.blacklist.includes(placeName)) {
            return true;
        }

        return false;
    }
}
