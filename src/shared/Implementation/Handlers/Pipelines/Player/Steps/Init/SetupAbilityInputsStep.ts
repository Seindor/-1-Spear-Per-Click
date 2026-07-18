import { Players } from "@rbxts/services";

import { PipelineContext } from "shared/Domain/Pipeline/Aggregates/PipelineContext";
import { PipelineStep } from "shared/Domain/Pipeline/Aggregates/PipelineStep";
import { Pipeline } from "shared/Domain/Pipeline/Decorators/Pipeline";

import {
    ClientPlayerContext,
    ClientPlayerPipelineToken,
} from "shared/Types/Pipelines/ClientsPlayer/ClientPlayerPipeline";

import type { AbilityAPI } from "shared/Domain/Ability/API/AbilityAPI";

import { AbilityPackHandler } from "shared/Implementation/Handlers/Abilities/AbilityPackHandler";

import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";
import { RuntimeEquipmentState } from "shared/Types/Replicators/Runtime/RuntimeEquipmentState";
import { ParseAliasModulePath } from "shared/Utilities/GetObjectFromPath";
import { AbilityPackDefinition } from "shared/Types/Game/Abilities/AbilityPackTypes";

const sharedScope = CompositionRootShared.createScope();

const abilityAPI = sharedScope.resolve(SharedRegistry.Singletons.API.AbilityAPI) as AbilityAPI;
const eventBusAPI = sharedScope.resolve(SharedRegistry.Singletons.API.EventBusAPI);
const clientAtomAPI = sharedScope.resolve(SharedRegistry.Singletons.API.ClientAtomAPI);

@Pipeline({ Pipeline: ClientPlayerPipelineToken })
export class SetupAbilityInputsStep extends PipelineStep<ClientPlayerContext> {
    public readonly Id = `SetupAbilityInputsStep`;
    public readonly After = [`LoadReplicatorsStep`];

    public Execute(ctx: PipelineContext<ClientPlayerContext>): void {
        const playerstrinUserId = tostring(Players.LocalPlayer.UserId);

        const inputsBus = eventBusAPI.New(playerstrinUserId, `Inputs`);

        const handler = new AbilityPackHandler(playerstrinUserId, inputsBus);

        clientAtomAPI.Subscribe<Record<string, RuntimeEquipmentState>, RuntimeEquipmentState>(
            ctx.Data.id,
            `SetupAbilityInputsStep`,
            `RuntimeEquipment`,
            `${ctx.Data.id}`,
            (value) => {
                if (!value) return;
                if (value.flags.weapon !== `none`) {
                    const module = ParseAliasModulePath(
                        `shared/Implementation/Entities/Abilities/${value.flags.weapon}/${value.flags.currentStage}`,
                    );

                    if (!module) {
                        warn("Ability pack not found");
                        return;
                    }

                    const abilityPack = require(module) as {
                        CreateAbilitiesPack: (ownerId: string) => AbilityPackDefinition;
                    };

                    handler.DetachAllPacks();
                    handler.AttachPack(abilityPack.CreateAbilitiesPack(playerstrinUserId));
                }
            },
        );

        ctx.MarkCompleted(this.Id);
    }
}
