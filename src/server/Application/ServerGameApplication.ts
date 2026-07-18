import { Workspace } from "@rbxts/services";

import { Dependency, OnStart, Service } from "@flamework/core";
import { AccessoryQualityFixHandler } from "server/Implementation/Handlers/AccessoryQualityFixHandler";
import { StepRunner } from "./StepRunner";

let NPCs = Workspace.WaitForChild("Map")!.WaitForChild("NPCs");

import {
    GameContext,
    GamePipelineToken,
} from "server/Implementation/Handlers/Pipelines/Game/GamePipeline";

import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";
import { ServerRegistry } from "server/DI/Generated/ServerRegistry";
import { CompositionRootServer } from "server/DI/CompositionRootServer";
import { ServerSignals } from "shared/Implementation/Entities/SerrverSignals";

const sharedScope = CompositionRootShared.createScope();
const serverScope = CompositionRootServer.createScope();

const pipelineAPI = sharedScope.resolve(SharedRegistry.Singletons.API.PipelineAPI);
const eventBusAPI = sharedScope.resolve(SharedRegistry.Singletons.API.EventBusAPI);

@Service()
export class ServerGameApplication implements OnStart {
    onStart(): void {
        print(`Game Init Launched`);

        let gameBus = eventBusAPI.New(`Game`, `Game`);

        new AccessoryQualityFixHandler();
        Dependency<StepRunner>();

        print(`Game Init Started.`);
        gameBus.Fire(`Game/Init/Started`, undefined, true);

        pipelineAPI.Run<GameContext>(GamePipelineToken, {
            pipelineName: `GamePipeline`,
            id: `Game`,
        });

        let gamePipeline = pipelineAPI.Get(GamePipelineToken)!;
        let gamePipelineContext = gamePipeline.GetContext(`Game`);

        if (gamePipelineContext?.IsFinished()) {
            gameBus.Fire(`Game/Init/Finished`, undefined, true);
        }

        print(`Game Init Completed`);
    }
}
