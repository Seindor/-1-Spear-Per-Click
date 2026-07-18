import { Players } from "@rbxts/services";

import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";
import { ServerRegistry } from "server/DI/Generated/ServerRegistry";
import { CompositionRootServer } from "server/DI/CompositionRootServer";
import { ServerSignals } from "shared/Implementation/Entities/SerrverSignals";

const sharedScope = CompositionRootShared.createScope();
const serverScope = CompositionRootServer.createScope();

const abilityAPI = sharedScope.resolve(SharedRegistry.Singletons.API.AbilityAPI);
const entitiesStorageAPI = sharedScope.resolve(SharedRegistry.Singletons.API.EntitiesStorageAPI);
const statusEffectsAPI = serverScope.resolve(ServerRegistry.Singletons.API.StatusEffectsAPI);
const solverAPI = sharedScope.resolve(SharedRegistry.Singletons.API.SolverAPI);
const traceClipAPI = sharedScope.resolve(SharedRegistry.Singletons.API.TraceClipAPI);

export function Create_Default_Run_Ability(ownerId: string) {
    let ability = abilityAPI.Create(
        {
            name: "Default_Run",
            ownerId,
            states: ["Idle"],
            additionalBlacklist: ["Dash", "Block", "WeaponClick"],
            lastUsed: 0,
            types: [{ name: "Movement", level: 1 }],
            cooldown: 0,
            duration: 0,
            minDuration: 0,
        },
        {
            onStartCheck() {
                let entity = entitiesStorageAPI.GetEntity(ownerId);
                if (!entity) return false;

                let walkSpeedSolver = solverAPI.GetSolver(`WalkSpeed_Solver_${ownerId}`)!;

                let character = entity.entity as Model;
                let humanoid = character.WaitForChild("Humanoid") as Humanoid;

                if (
                    statusEffectsAPI.CheckStatuses(
                        ownerId,
                        ability.GetBlacklist(),
                        ability.config.ignoreList ?? [],
                    )
                ) {
                    walkSpeedSolver.RemoveSolverNumber("Default_Run_OnStart");

                    if (entity.HasTag("Player")) {
                        ServerSignals.Ability.fire(
                            Players.GetPlayerFromCharacter(character)!,
                            "Default_Run",
                            "Hold",
                            "Reject",
                            true,
                        );
                    }
                    return false;
                }

                return true;
            },
            onEndCheck(trueEnd?: boolean) {
                if (trueEnd) return true;
                return false;
            },
            onStart() {
                let entity = entitiesStorageAPI.GetEntity(ownerId);
                if (!entity) return;

                let walkSpeedSolver = solverAPI.GetSolver(`WalkSpeed_Solver_${ownerId}`)!;

                let character = entity.entity as Model;
                let humanoid = character.WaitForChild("Humanoid") as Humanoid;

                walkSpeedSolver.SetSolverNumber({
                    sourceId: "Default_Run_OnStart",
                    phaseName: "Flat",
                    value: 8,
                    tags: ["Run"],
                });

                statusEffectsAPI.CreateStatus("Run", { duration: math.huge }, true, ownerId);
            },
            onEnd() {
                let entity = entitiesStorageAPI.GetEntity(ownerId);
                if (!entity) return;

                let walkSpeedSolver = solverAPI.GetSolver(`WalkSpeed_Solver_${ownerId}`)!;

                let character = entity.entity as Model;
                let humanoid = character.WaitForChild("Humanoid") as Humanoid;

                walkSpeedSolver.RemoveSolverNumber("Default_Run_OnStart");

                statusEffectsAPI.RemoveStatus(ownerId, "Run");
            },
            onInterrupt() {},
            onReject() {},
        },
    );

    return ability;
}
