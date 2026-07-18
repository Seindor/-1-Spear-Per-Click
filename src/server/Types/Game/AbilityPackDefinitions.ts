import type { AbilityAggregate } from "shared/Domain/Ability/Aggregates/AbilityAggregate";

export interface AbilityBindEntry {
    readonly abilityName: string;
    readonly priority: number;
    readonly ability: AbilityAggregate;
}

export interface AbilityPackDefinition {
    readonly name: string;
    readonly abilities: Record<string, AbilityBindEntry>;
}
