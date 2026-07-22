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
export class MapInitStep extends PipelineStep<ClientPlayerContext> {
    public readonly Id = `MapInitStep`;

    public After = [`LoadReplicatorsStep`];

    public Config = {
        launchParallel: true,
    } as IStepConfig;

    public _janitor = janitorAPI.CreateActor(`Map`);

    public Execute(ctx: PipelineContext<ClientPlayerContext>): void {
        const id = this.Id;

        ctx.MarkCompleted(this.Id);
    }
}
