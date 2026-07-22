import {
    PlayerContext,
    PlayerPipelineToken,
} from "server/Implementation/Handlers/Pipelines/Player/PlayerPipeline";

import { StrengthControllerToken } from "server/Implementation/Handlers/Runtimes/SessionRuntime/Controllers/RuntimeStats";

import { DataHandler } from "server/Implementation/Handlers/Game/Data/DataHandler";

import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";
import GameItemData from "shared/Utilities/GameHelpers/GameItemData";
import { IWeaponData } from "shared/Utilities/GameHelpers/GameItemData/Types/IWeaponData";
import { Create_Strength_Gain_Cooldown_Solver } from "shared/Implementation/Entities/Solvers/Progression/StrengthGainCooldownSolver";

const sharedScope = CompositionRootShared.createScope();

const abilityAPI = sharedScope.resolve(SharedRegistry.Singletons.API.AbilityAPI);
const pipelineAPI = sharedScope.resolve(SharedRegistry.Singletons.API.PipelineAPI);
const runtimeAPI = sharedScope.resolve(SharedRegistry.Singletons.API.RuntimeAPI);
const eventBusAPI = sharedScope.resolve(SharedRegistry.Singletons.API.EventBusAPI);
const solverAPI = sharedScope.resolve(SharedRegistry.Singletons.API.SolverAPI);

export function Create_Main_Click_Ability(ownerId: string) {
    let ability = abilityAPI.Create(
        {
            ownerId: ownerId,
            name: `Main_Click`,

            lastUsed: -999999,
            cooldown: 0,

            duration: 0.05,
            minDuration: 0.05,

            states: [`Idle`],
            types: [{ name: `Combat`, level: 1 }],

            miscData: new Map<string, any>(),
            tags: [],
        },
        {
            onStartCheck(...args) {
                return true;
            },

            onStart(...args) {
                let statsRuntime = runtimeAPI.Get(ownerId, `Stats`);
                let playerCtx = pipelineAPI.GetContext<PlayerContext>(PlayerPipelineToken, ownerId);
                const progressionBus = eventBusAPI.New(ownerId, `Progression`);
                const gamePlayBus = eventBusAPI.New(ownerId, `GamePlay`);
                const entitySolvers = solverAPI.NewPack(ownerId);

                if (!playerCtx || !playerCtx.IsFinished()) {
                    warn(
                        `[${ability.config.name}] Player pipeline for ${ownerId} is not finished.`,
                    );
                    return;
                }

                if (!statsRuntime) {
                    warn(`[${ability.config.name}] StatsRuntime for ${ownerId} is nil.`);
                    return;
                }

                const dataHandler = playerCtx.Get<DataHandler>(`DataHandler`);

                if (!dataHandler) {
                    warn(`[${ability.config.name}] DataHandler for ${ownerId} is nil.`);
                    return;
                }

                let strengthGainCooldownSolver = Create_Strength_Gain_Cooldown_Solver(ownerId);

                const data = dataHandler.GetData();

                const entityWeapon = data.equipment.weapon;
                const weaponData = GameItemData.GetGameplayItemData<IWeaponData>(
                    `Weapons`,
                    entityWeapon,
                );

                ability.config.cooldown = strengthGainCooldownSolver.CalculateValue(
                    weaponData.Cooldown,
                );

                strengthGainCooldownSolver.Subscribe(
                    ["Add", "Remove", "Set"],
                    `StrengthGainCooldownController/Replicated`,
                    () => {
                        ability.config.cooldown = strengthGainCooldownSolver.CalculateValue(
                            weaponData.Cooldown,
                        );
                    },
                );

                gamePlayBus.Fire(`Weapon/Click`);

                for (const [index, stat] of pairs(weaponData.Stats)) {
                    progressionBus.Fire(`AddStat`, undefined, undefined, index, stat);
                }
            },

            onEndCheck(...args) {
                return true;
            },

            onEnd(...args) {},

            onInterrupt(...args) {},
        },
    );
    return ability;
}
