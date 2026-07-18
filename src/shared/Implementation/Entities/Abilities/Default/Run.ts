import { RunService } from "@rbxts/services";

import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";
import { CreateSimpleAbility } from "shared/Implementation/Handlers/Abilities/CreateSimpleAbility";
import { AbilityAggregate } from "shared/Domain/Ability/Aggregates/AbilityAggregate";

const sharedScope = CompositionRootShared.createScope();

const abilityAPI = sharedScope.resolve(SharedRegistry.Singletons.API.AbilityAPI);
const replicatedStatusEffectsAPI = sharedScope.resolve(
    SharedRegistry.Singletons.API.ReplicatedStatusEffectsAPI,
);
const entitiesStorageAPI = sharedScope.resolve(SharedRegistry.Singletons.API.EntitiesStorageAPI);

export function Create_Default_Run_Ability(ownerId: string): AbilityAggregate {
    const getHumanoid = () => {
        const entity = entitiesStorageAPI.GetEntity(ownerId)!;
        const character = entity.entity as Model;
        return character.WaitForChild("Humanoid") as Humanoid;
    };

    const getCharacter = () => {
        const entity = entitiesStorageAPI.GetEntity(ownerId)!;
        const character = entity.entity as Model;
        return character as Model;
    };

    const startSprint = () => {
        replicatedStatusEffectsAPI.Unsubscribe(ownerId, "Run_InterruptSubscribe");

        replicatedStatusEffectsAPI.Subscribe(
            ownerId,
            [
                { status: "Stun", event: "Added" },
                { status: "Block", event: "Added" },
                { status: "WeaponClick", event: "Added" },
                { status: "Knocked", event: "Added" },
                { status: "Dead", event: "Added" },
            ],
            () => {
                ability.Interrupt();
            },
            "Run_InterruptSubscribe",
        );
        getHumanoid().WalkSpeed = 20;
        ability.config.miscData!.set("IsSprinting", true);
    };

    const stopSprint = (ignoreCheck?: boolean) => {
        if (!ability.config.miscData!.get("IsSprinting")! && ignoreCheck !== true) return;

        getHumanoid().WalkSpeed = (getCharacter().GetAttribute("WalkSpeed") as number) ?? 12;

        ability.config.cooldown = 0.5;
        ability._janitor.Remove("ChangeCooldown");
        ability._janitor.Add(
            task.delay(0.5, () => {
                ability.config.cooldown = 0;
            }),
            true,
            "ChangeCooldown",
        );
        ability.config.miscData!.set("IsSprinting", false);
    };

    let ability = abilityAPI.Create(
        {
            ownerId: ownerId,
            name: `Default_Run`,
            states: ["Idle"],
            additionalBlacklist: ["Dash", "Block", "WeaponClick"],
            types: [{ name: `Movement`, level: 1 }],

            lastUsed: 0,
            cooldown: 0,

            duration: math.huge,
            minDuration: 0,
            miscData: new Map<string, unknown>(),
        },
        {
            onStartCheck() {
                if (
                    replicatedStatusEffectsAPI.CheckReplicatedStatuses(
                        ownerId,
                        ability.GetBlacklist(),
                        ability.config.ignoreList ?? [],
                    )
                )
                    return false;

                if (
                    replicatedStatusEffectsAPI.CheckClientStatuses(
                        ownerId,
                        ability.GetBlacklist(),
                        ability.config.ignoreList ?? [],
                    )
                )
                    return false;

                return true;
            },

            onEndCheck() {
                if (
                    replicatedStatusEffectsAPI.CheckReplicatedStatuses(
                        ownerId,
                        ability.GetBlacklist(),
                        ability.config.ignoreList ?? [],
                    )
                )
                    return false;

                if (
                    replicatedStatusEffectsAPI.CheckClientStatuses(
                        ownerId,
                        ability.GetBlacklist(),
                        ability.config.ignoreList ?? [],
                    )
                )
                    return false;

                return true;
            },

            onStart(...args) {
                startSprint();

                ability._janitor.Add(
                    RunService.Heartbeat.Connect(() => {
                        if (!ability.config.states.includes("Holding")) {
                            ability.Execute("End", true);
                        }
                    }),
                    "Disconnect",
                    "HoldingCheck",
                );
            },

            onInterrupt() {
                stopSprint(true);
            },

            onEnd() {
                ability._janitor.Remove("HoldingCheck");
                stopSprint();
            },

            onReject(trueStop?: boolean) {
                if (trueStop === true) {
                    stopSprint(true);
                }
            },
        },
    );

    return ability;
}
