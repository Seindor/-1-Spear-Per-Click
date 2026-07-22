import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";
import { AbilityPackDefinition } from "shared/Types/Game/Abilities/AbilityPackTypes";
import { Create_Main_Click_Ability } from "./Click";

const sharedScope = CompositionRootShared.createScope();

const abilityAPI = sharedScope.resolve(SharedRegistry.Singletons.API.AbilityAPI);

export function CreateAbilitiesPack(ownerId: string): AbilityPackDefinition {
    let abilities = {
        name: `Default`,
        abilities: {
            [`M1`]: {
                abilityName: `Click`,
                priority: 1,
                activation: `ClientThenServer`,
                ability: Create_Main_Click_Ability(ownerId),
                key: `M1`,
                mode: `Press`,
            },
        },
    } as AbilityPackDefinition;

    return abilities;
}
