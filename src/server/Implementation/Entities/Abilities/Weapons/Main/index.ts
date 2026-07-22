import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";
import { AbilityPackDefinition } from "server/Types/Game/AbilityPackDefinitions";
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
                ability: Create_Main_Click_Ability(ownerId),
            },
        },
    } as AbilityPackDefinition;

    return abilities;
}
