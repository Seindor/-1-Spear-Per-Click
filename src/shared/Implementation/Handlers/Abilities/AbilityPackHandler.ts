// ─────────────────────────────────────────────
//  shared/Implementation/Handlers/Abilities/AbilityPackHandler.ts
// ─────────────────────────────────────────────

import { UserInputService } from "@rbxts/services";

import type { AbilityAPI } from "shared/Domain/Ability/API/AbilityAPI";
import type { AbilityAggregate } from "shared/Domain/Ability/Aggregates/AbilityAggregate";
import type EventBusAggregate from "shared/Domain/EventBus/Aggregates/EventBusAggregate";

import { AbilityLoadout } from "./AbilityLoadout";
import type {
    AbilityBindEntry,
    AbilityPackDefinition,
} from "shared/Types/Game/Abilities/AbilityPackTypes";

import { ClientSignals } from "shared/Implementation/Entities/ClientSignals";

type AbilityNetworkMethod = "Start" | "End" | "Reject" | "Interrupt";

interface KeyRuntimeState {
    held: boolean;
    inputObject?: InputObject;
    activeExclusiveEntry?: AbilityBindEntry;
    activeParallelEntries: Set<AbilityBindEntry>;
}

import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";

const sharedScope = CompositionRootShared.createScope();

const abilityAPI = sharedScope.resolve(SharedRegistry.Singletons.API.AbilityAPI);

/**
 * One handler per owner (id)
 * Combine AbilityAPI (Domain) with inputs eventbus с конкретным Inputs eventbus from that owner and resove
 *  - Exclusive-ability - start on input from priority (Parry -> Block)
 *  - Parallel-ability - start al together independently from queue
 *
 * @example
 * ```ts
 * const handler = new AbilityPackHandler(id, abilityAPI, inputsBus);
 * handler.AttachPack(CreateDefaultPack(abilityAPI, id));
 * ```
 */

export class AbilityPackHandler {
    private readonly loadout: AbilityLoadout;
    private readonly keyStates = new Map<string, KeyRuntimeState>();

    constructor(
        private readonly ownerId: string,
        inputsBus: EventBusAggregate,
    ) {
        this.loadout = new AbilityLoadout(ownerId);
        abilityAPI.initActor(ownerId);

        inputsBus.Subscribe(
            "InputPressed",
            (key: string, inputState: Enum.UserInputState, inputObject: InputObject) => {
                this.HandleInput(key, inputState, inputObject);
            },
            undefined,
            "AbilityPackHandler",
        );

        ClientSignals.Ability.connect((abilityName, _abilityType, method) => {
            this.HandleServerFeedback(abilityName, method);
        });
    }

    public AttachPack(pack: AbilityPackDefinition): void {
        this.loadout.AddPack(pack);
    }

    public DetachPack(packName: string): void {
        this.loadout.RemovePack(packName);
    }

    public DetachAllPacks(): void {
        this.loadout.RemoveAllPacks();
    }

    public HasPack(packName: string): boolean {
        return this.loadout.HasPack(packName);
    }

    private HandleInput(
        key: string,
        inputState: Enum.UserInputState,
        inputObject: InputObject,
    ): void {
        const entries = this.loadout.GetEntriesFor(key);
        if (entries.size() === 0) return;

        if (inputState === Enum.UserInputState.Begin) {
            const state: KeyRuntimeState = {
                held: true,
                inputObject,
                activeParallelEntries: new Set(),
            };
            this.keyStates.set(key, state);

            for (const entry of entries) {
                if (entry.concurrency !== "Parallel") continue;
                if (!this.IsComboSatisfied(entry)) continue;

                if (this.TryStartEntry(entry, inputObject)) {
                    state.activeParallelEntries.add(entry);
                }
            }

            const exclusiveEntries = entries.filter((entry) => entry.concurrency !== "Parallel");
            this.TryActivateExclusiveFrom(key, exclusiveEntries, 0);
            return;
        }

        if (inputState === Enum.UserInputState.End) {
            const state = this.keyStates.get(key);
            if (!state) return;

            state.held = false;
            state.inputObject = inputObject;

            for (const entry of state.activeParallelEntries) {
                this.EndEntry(entry, inputObject);
            }
            state.activeParallelEntries.clear();

            if (state.activeExclusiveEntry) {
                this.EndEntry(state.activeExclusiveEntry, inputObject);
            }
        }
    }

    private TryActivateExclusiveFrom(
        key: string,
        exclusiveEntries: AbilityBindEntry[],
        fromIndex: number,
    ): void {
        const state = this.keyStates.get(key);
        if (!state?.held) return;

        for (let i = fromIndex; i < exclusiveEntries.size(); i++) {
            const entry = exclusiveEntries[i];

            if (!this.IsComboSatisfied(entry)) continue;

            const started = this.TryStartEntry(entry, state.inputObject!);

            if (started) {
                state.activeExclusiveEntry = entry;
                this.WatchEntryEnd(key, exclusiveEntries, i);
                return;
            }
        }

        state.activeExclusiveEntry = undefined;
    }

    private WatchEntryEnd(key: string, exclusiveEntries: AbilityBindEntry[], index: number): void {
        const entry = exclusiveEntries[index];
        if (!entry.ability) return;

        const ability = entry.ability;

        const onFinished = (finishedAbility: AbilityAggregate) => {
            if (finishedAbility !== ability) return;

            ability.UnsubscribeEvent("Ended", onFinished);
            ability.UnsubscribeEvent("Interrupted", onFinished);

            const state = this.keyStates.get(key);
            if (!state?.held) return;
            if (state.activeExclusiveEntry !== entry) return;

            this.TryActivateExclusiveFrom(key, exclusiveEntries, index + 1);
        };

        ability.SubscribeEvent("Ended", onFinished);
        ability.SubscribeEvent("Interrupted", onFinished);
    }

    private HandleServerFeedback(abilityName: string, method: AbilityNetworkMethod): void {
        const isTerminal = method === "End" || method === "Interrupt" || method === "Reject";
        if (!isTerminal) return;

        for (const [key, state] of this.keyStates) {
            if (state.activeExclusiveEntry?.abilityName === abilityName) {
                const entry = state.activeExclusiveEntry;

                if (entry.ability) {
                    entry.ability.Interrupt();
                } else {
                    state.activeExclusiveEntry = undefined;

                    if (state.held) {
                        const exclusiveEntries = this.loadout
                            .GetEntriesFor(key)
                            .filter((e) => e.concurrency !== "Parallel");

                        const index = exclusiveEntries.findIndex(
                            (e) => e.abilityName === abilityName,
                        );
                        this.TryActivateExclusiveFrom(key, exclusiveEntries, index + 1);
                    }
                }
            }

            for (const entry of state.activeParallelEntries) {
                if (entry.abilityName !== abilityName) continue;

                if (entry.ability) {
                    entry.ability.Interrupt();
                } else {
                    state.activeParallelEntries.delete(entry);
                }
            }
        }
    }

    private TryStartEntry(entry: AbilityBindEntry, inputObject: InputObject): boolean {
        if (entry.activation === "ServerOnly") {
            ClientSignals.Ability.fire(entry.abilityName, entry.mode, "Start", inputObject);
            return true;
        }

        if (!entry.ability) {
            warn(
                `[AbilityPackHandler] "${entry.abilityName}": activation "${entry.activation}" requires a client ability instance`,
            );
            return false;
        }

        if (entry.ability.OnCooldown()) {
            return false;
        }

        abilityAPI.Execute(entry.ability, "Start", true, inputObject);

        if (entry.ability.config.duration !== 0 || entry.ability.config.minDuration !== 0) {
            if (!entry.ability.HasState("Active")) {
                return false;
            }
        }

        if (entry.mode === "Hold") {
            entry.ability.AddState("Holding");
        }

        if (entry.activation === "ClientThenServer") {
            ClientSignals.Ability.fire(entry.abilityName, entry.mode, "Start", inputObject);
        }

        return true;
    }

    private EndEntry(entry: AbilityBindEntry, inputObject: InputObject): void {
        if (entry.activation === "ServerOnly") {
            ClientSignals.Ability.fire(entry.abilityName, entry.mode, "End", inputObject);
            return;
        }

        if (!entry.ability) return;

        if (entry.mode === "Hold") {
            entry.ability.RemoveState("Holding");
            abilityAPI.Execute(entry.ability, "End", true, inputObject);
        }

        if (entry.activation === "ClientThenServer") {
            ClientSignals.Ability.fire(entry.abilityName, entry.mode, "End", inputObject);
        }
    }

    private IsComboSatisfied(entry: AbilityBindEntry): boolean {
        if (!entry.comboKeys || entry.comboKeys.size() === 0) return true;
        return entry.comboKeys.every((key) => UserInputService.IsKeyDown(key));
    }
}
