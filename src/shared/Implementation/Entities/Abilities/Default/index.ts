import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";
import { AbilityPackDefinition } from "shared/Types/Game/Abilities/AbilityPackTypes";
import { Create_Default_Run_Ability } from "./Run";

const sharedScope = CompositionRootShared.createScope();

const abilityAPI = sharedScope.resolve(SharedRegistry.Singletons.API.AbilityAPI);

export function CreateAbilitiesPack(ownerId: string): AbilityPackDefinition {
    let abilities = {
        name: `Default`,
        abilities: {},
    } as AbilityPackDefinition;

    return abilities;
}
