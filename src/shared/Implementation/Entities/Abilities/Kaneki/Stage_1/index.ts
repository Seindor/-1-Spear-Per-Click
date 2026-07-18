import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";
import { AbilityPackDefinition } from "shared/Types/Game/Abilities/AbilityPackTypes";
import { Create_Default_Run_Ability } from "../../Default/Run";

const sharedScope = CompositionRootShared.createScope();

const abilityAPI = sharedScope.resolve(SharedRegistry.Singletons.API.AbilityAPI);

export function CreateAbilitiesPack(ownerId: string): AbilityPackDefinition {
    let abilities = {
        name: `Kaneki_Stage_1`,
        abilities: {
            Run: {
                key: `Run`,
                priority: 1,
                abilityName: `Run`,
                mode: `Hold`,
                activation: `ClientThenServer`,
                ability: Create_Default_Run_Ability(ownerId),
            },
        },
    } as AbilityPackDefinition;

    return abilities;
}
