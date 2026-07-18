import { PipelineContext } from "shared/Domain/Pipeline/Aggregates/PipelineContext";
import { PipelineStep } from "shared/Domain/Pipeline/Aggregates/PipelineStep";
import { Pipeline } from "shared/Domain/Pipeline/Decorators/Pipeline";
import {
    ClientCharacterContext,
    ClientCharacterPipelineToken,
} from "shared/Types/Pipelines/CharacterPipeline";

import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";

const sharedScope = CompositionRootShared.createScope();

const entitiesStorageAPI = sharedScope.resolve(SharedRegistry.Singletons.API.EntitiesStorageAPI);

@Pipeline({ Pipeline: ClientCharacterPipelineToken })
export class SetupCharacterStep extends PipelineStep<ClientCharacterContext> {
    public readonly Id = `SetupCharacterStep`;

    private SetupEntity(ctx: PipelineContext<ClientCharacterContext>) {
        let entity = entitiesStorageAPI.AddEntity(ctx.Data.id, ctx.Data.character);

        entity.AddTag(ctx.Data.type);
    }

    public Execute(ctx: PipelineContext<ClientCharacterContext>): void {
        this.SetupEntity(ctx);

        ctx.MarkCompleted(this.Id);
    }
}
