import { PipelineContext } from "shared/Domain/Pipeline/Aggregates/PipelineContext";
import { PipelineStep } from "shared/Domain/Pipeline/Aggregates/PipelineStep";
import { Pipeline } from "shared/Domain/Pipeline/Decorators/Pipeline";
import {
    ClientCharacterContext,
    ClientCharacterPipelineToken,
} from "shared/Types/Pipelines/CharacterPipeline";

import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";
import { ClientMovementAnimationHandlerRegistry } from "shared/Implementation/Handlers/Animations/MovementAnimations/ClientMovementAnimationsHandlerRegistry";
import { IsPlaceBlacklisted, PlaceBlacklist } from "shared/Types/Game/ServerInfo";

const sharedScope = CompositionRootShared.createScope();

const entitiesStorageAPI = sharedScope.resolve(SharedRegistry.Singletons.API.EntitiesStorageAPI);

@Pipeline({ Pipeline: ClientCharacterPipelineToken })
export class SetupAnimationsStep extends PipelineStep<ClientCharacterContext> {
    public readonly Id = `SetupAnimationsStep`;
    public readonly After = [`SetupCharacterStep`];
    public blacklist = [`Main Menu`] as PlaceBlacklist;

    public Execute(ctx: PipelineContext<ClientCharacterContext>): void {
        if (IsPlaceBlacklisted(this.blacklist)) {
            ctx.MarkFailed(this.Id);
            return;
        }

        let character = ctx.Data.character;
        let humanoid = character.WaitForChild(`Humanoid`) as Humanoid;
        let humanoidRootPart = character.WaitForChild(`HumanoidRootPart`) as BasePart;

        ClientMovementAnimationHandlerRegistry.Attach(ctx.Data.id, `Main`, {
            character: character,
            rootPart: humanoidRootPart,
            humanoid: humanoid,
        });

        ctx.MarkCompleted(this.Id);
    }
}
