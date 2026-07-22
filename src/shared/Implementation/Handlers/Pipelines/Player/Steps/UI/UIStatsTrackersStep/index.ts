import { Workspace, StarterGui } from "@rbxts/services";

import {
    ClientPlayerContext,
    ClientPlayerPipelineToken,
} from "shared/Types/Pipelines/ClientsPlayer/ClientPlayerPipeline";
import { PipelineContext } from "shared/Domain/Pipeline/Aggregates/PipelineContext";
import { IStepConfig } from "shared/Domain/Pipeline/Types/PipelineTypes";

import { Pipeline } from "shared/Domain/Pipeline/Decorators/Pipeline";
import { PipelineStep } from "shared/Domain/Pipeline/Aggregates/PipelineStep";

import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";
import { IPlayer_Interface } from "shared/Types/Gameplay/UI/IPlayerInterface";

const sharedScope = CompositionRootShared.createScope();

const janitorAPI = sharedScope.resolve(SharedRegistry.Singletons.API.JanitorAPI);

@Pipeline({ Pipeline: ClientPlayerPipelineToken })
export class UIStatsTrackersStep extends PipelineStep<ClientPlayerContext> {
    public readonly Id = `UIStatsTrackersStep`;
    public After = [`UIInitStep`, `LoadReplicatorsStep`];
    public readonly playerInterfaceName = `Player_Interface`;

    public Config = {
        launchParallel: true,
    } as IStepConfig;

    public _janitor = janitorAPI.CreateActor(`UI`);
    public controllers = new Map<string, object>();

    public Execute(ctx: PipelineContext<ClientPlayerContext>): void {
        const id = this.Id;
        let player = ctx.Data.player;
        let playerGui = player.WaitForChild(`PlayerGui`) as PlayerGui;
        let playerInterface = playerGui.WaitForChild(this.playerInterfaceName) as IPlayer_Interface;

        for (const module of script.GetChildren() as ModuleScript[]) {
            const required = require(module) as Record<string, defined>;

            const [requiredName, requiredClass] = next(required)!;

            const Controller = requiredClass as {
                new (
                    ctx: PipelineContext<ClientPlayerContext>,
                    playerInterface: IPlayer_Interface,
                ): { id: string } & object;
            };

            let importedController = new Controller(ctx, playerInterface);

            this.controllers.set(importedController.id, importedController);
        }

        ctx.Set(`${this.Id}/Controllers`, this.controllers);

        ctx.MarkCompleted(this.Id);
    }
}
