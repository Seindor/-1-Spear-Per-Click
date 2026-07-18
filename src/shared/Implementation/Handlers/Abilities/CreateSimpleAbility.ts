import type {
    IAbilityBehaviour,
    IAbilityConfig,
    IAbilityType,
} from "shared/Domain/Ability/Types/AbilityTypes";

import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";

const sharedScope = CompositionRootShared.createScope();

const abilityAPI = sharedScope.resolve(SharedRegistry.Singletons.API.AbilityAPI);

export function CreateSimpleAbility(
    ownerId: string,
    name: string,
    overrides: Partial<IAbilityConfig> & { types: IAbilityType[] },
    behaviours: IAbilityBehaviour,
) {
    const config: IAbilityConfig = {
        name,
        ownerId,
        states: ["Idle"],
        lastUsed: 0,
        cooldown: 0,
        duration: 0,
        minDuration: 0,
        ...overrides,
    };

    return abilityAPI.Create(config, behaviours);
}
