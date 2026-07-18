import { Players } from "@rbxts/services";

import { Controller, OnStart } from "@flamework/core";

import {
    ClientPlayerContext,
    ClientPlayerPipelineToken,
} from "shared/Types/Pipelines/ClientsPlayer/ClientPlayerPipeline";
import {
    ClientCharacterContext,
    ClientCharacterPipelineToken,
} from "shared/Types/Pipelines/CharacterPipeline";

import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";

const sharedScope = CompositionRootShared.createScope();

const clientAtomAPI = sharedScope.resolve(SharedRegistry.Singletons.API.ClientAtomAPI);
const pipelineAPI = sharedScope.resolve(SharedRegistry.Singletons.API.PipelineAPI);

@Controller()
export class ClientPlayerApplication implements OnStart {
    onStart(): void {
        print("Client Player Init Launched");

        let player = Players.LocalPlayer;
        let playerStringId = tostring(player.UserId);

        if (player.Character) {
            pipelineAPI.Run<ClientCharacterContext>(ClientCharacterPipelineToken, {
                pipelineName: `ClientCharacterPipeline`,
                id: playerStringId,
                character: player.Character,
                type: `Player`,
            });
        }

        player.CharacterAdded.Connect((character: Model) => {
            pipelineAPI.Run<ClientCharacterContext>(ClientCharacterPipelineToken, {
                pipelineName: `ClientCharacterPipeline`,
                id: playerStringId,
                character: character,
                type: `Player`,
            });
        });

        pipelineAPI.Run<ClientPlayerContext>(ClientPlayerPipelineToken, {
            pipelineName: `ClientPlayerPipeline`,
            id: playerStringId,
            player,
        });

        print(`Client Player Init Completed`);
    }
}
