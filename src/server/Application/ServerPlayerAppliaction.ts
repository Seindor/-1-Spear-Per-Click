import { Players } from "@rbxts/services";
import { Service, OnStart } from "@flamework/core";

import type { PipelineAPI } from "shared/Domain/Pipeline/API/PipelineAPI";
import type { RuntimeAPI } from "shared/Domain/Runtime/API/RuntimeAPI";

import type { SessionContext } from "shared/Types/Runtime/SessionRuntime";

import {
    PlayerPipelineToken,
    PlayerContext,
} from "server/Implementation/Handlers/Pipelines/Player/PlayerPipeline";
import {
    CharacterContext,
    CharacterPipelineToken,
} from "server/Implementation/Handlers/Pipelines/Character/CharacterPipeline";

import { CompositionRootShared } from "shared/DI/CompositionRootShared";
import { CompositionRootServer } from "server/DI/CompositionRootServer";
import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { ServerRegistry } from "server/DI/Generated/ServerRegistry";
import { GameTeleportData } from "shared/Types/Game/TeleportDatas/TeleportData";

const sharedScope = CompositionRootShared.createScope();
const serverScope = CompositionRootServer.createScope();

const pipelineAPI = sharedScope.resolve(SharedRegistry.Singletons.API.PipelineAPI) as PipelineAPI;
const runtimeAPI = sharedScope.resolve(
    SharedRegistry.Singletons.API.RuntimeAPI,
) as RuntimeAPI<SessionContext>;
const eventBusAPI = sharedScope.resolve(SharedRegistry.Singletons.API.EventBusAPI);

@Service()
export class ServerPlayerApplication implements OnStart {
    public onStart(): void {
        Players.PlayerAdded.Connect((player) => {
            const id = tostring(player.UserId);

            print(`Player/${id} Init Launched`);

            let entityBus = eventBusAPI.Get(id, `Entity`);
            let serversBus = eventBusAPI.New(`Game`, `Servers`);

            let joinData = player.GetJoinData();
            let teleportData = joinData.TeleportData as GameTeleportData;

            serversBus.Fire(`Player/TeleportData`, undefined, true, teleportData);

            player.CharacterAdded.Connect((character: Model) => {
                entityBus.Fire(`Character/Init/Started`, undefined, true);

                pipelineAPI.Run<CharacterContext>(CharacterPipelineToken, {
                    pipelineName: `CharacterPipeline`,
                    id,
                    character: character,
                    type: `Player`,
                });

                const characterCtx = pipelineAPI.GetContext<CharacterContext>(
                    CharacterPipelineToken,
                    id,
                );

                if (characterCtx?.IsFinished()) {
                    entityBus.Fire(`Character/Init/Finished`, undefined, true);
                }
            });

            entityBus.Fire(`Player/Init/Started`, undefined, true);

            pipelineAPI.Run<PlayerContext>(PlayerPipelineToken, {
                pipelineName: `PlayerPipeline`,
                id,
                player,
            });

            const playerCtx = pipelineAPI.GetContext<PlayerContext>(PlayerPipelineToken, id);

            if (playerCtx?.IsFinished()) {
                entityBus.Fire(`Player/Init/Finished`, undefined, true);
            }

            print(`Player/${id} Init Completed`);
        });

        Players.PlayerRemoving.Connect((player) => {
            const id = tostring(player.UserId);

            runtimeAPI.Remove(id, "Session");

            // Чистим сохранённые контексты пайплайнов, чтобы не копить память
            // после выхода игрока.
            pipelineAPI.RemoveContext(PlayerPipelineToken, id);
            pipelineAPI.RemoveContext(CharacterPipelineToken, id);
        });
    }
}
