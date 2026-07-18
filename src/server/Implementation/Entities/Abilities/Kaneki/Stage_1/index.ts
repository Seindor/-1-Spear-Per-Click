import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";
import { Create_Default_Run_Ability } from "../../Default/Run";
import { AbilityPackDefinition } from "server/Types/Game/AbilityPackDefinitions";

const sharedScope = CompositionRootShared.createScope();

const abilityAPI = sharedScope.resolve(SharedRegistry.Singletons.API.AbilityAPI);

export function CreateAbilitiesPack(ownerId: string): AbilityPackDefinition {
    let abilities = {
        name: `Kaneki_Stage_1`,
        abilities: {
            [`Run`]: {
                abilityName: `Run`,
                priority: 1,
                ability: Create_Default_Run_Ability(ownerId),
            },
        },
    } as AbilityPackDefinition;

    return abilities;
}
