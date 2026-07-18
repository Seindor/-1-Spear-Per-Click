import type { AbilityAggregate } from "shared/Domain/Ability/Aggregates/AbilityAggregate";

export type AbilityActivation = "ClientOnly" | "ClientThenServer" | "ServerOnly";

export type AbilityInputMode = "Press" | "Hold";
export type AbilityConcurrency = "Exclusive" | "Parallel";

export type AbilityNetworkMethod = "Start" | "End" | "Reject" | "Interrupt";

export interface AbilityBindEntry {
    readonly key: string;
    readonly comboKeys?: readonly Enum.KeyCode[];
    readonly priority: number;

    readonly abilityName: string;

    readonly mode: AbilityInputMode;
    readonly activation: AbilityActivation;

    readonly concurrency?: AbilityConcurrency;

    readonly ability?: AbilityAggregate;
}

export interface AbilityPackDefinition {
    readonly name: string;
    readonly abilities: Record<string, AbilityBindEntry>;
}
