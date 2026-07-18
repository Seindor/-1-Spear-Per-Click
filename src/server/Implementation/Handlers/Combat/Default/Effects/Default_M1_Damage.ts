import { Workspace } from "@rbxts/services";

import { PhaseResolverContext } from "shared/Domain/PhaseResolver/Types/PhaseResolverTypes";

import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";
import { ServerRegistry } from "server/DI/Generated/ServerRegistry";
import { CompositionRootServer } from "server/DI/CompositionRootServer";
import { ServerSignals } from "shared/Implementation/Entities/SerrverSignals";
import { Default_HitContext } from "../Contexts/Default_HitContext";

const sharedScope = CompositionRootShared.createScope();
const serverScope = CompositionRootServer.createScope();

let phaseResolverAPI = sharedScope.resolve(SharedRegistry.Singletons.API.PhaseResolverAPI);
let gameEffectsAPI = serverScope.resolve(ServerRegistry.Singletons.API.GameEffectsAPI);
let statusEffectsAPI = serverScope.resolve(ServerRegistry.Singletons.API.StatusEffectsAPI);
let traceClipAPI = sharedScope.resolve(SharedRegistry.Singletons.API.TraceClipAPI);
let entitiesStorageAPI = sharedScope.resolve(SharedRegistry.Singletons.API.EntitiesStorageAPI);
let eventBusAPI = sharedScope.resolve(SharedRegistry.Singletons.API.EventBusAPI);
let solverAPI = sharedScope.resolve(SharedRegistry.Singletons.API.SolverAPI);

export const Default_M1_Damage_Effect = (ownerId: string) => {
    gameEffectsAPI.registerHandler("Default_M1_Damage_Effect", (effect, ctx) => {
        const payload = effect.payload as Default_HitContext;
        let target_entity = entitiesStorageAPI.GetEntity(payload.targetId)!;
        let target_character = target_entity.entity as Model;
        let characterName = target_entity.GetState("CharacterName") as string | undefined;
        let target_humanoid = target_character.WaitForChild("Humanoid") as Humanoid;

        const ownerCombatBus = eventBusAPI.Get(payload.ownerId, `Combat`);
        const targetCombatBus = eventBusAPI.Get(payload.targetId, `Combat`);

        const ownerDamageSolver = solverAPI.GetSolver(`Damage_Solver_${ownerId}`)!;

        if (!payload.damage.health) return;

        let finalHealthDamage = ownerDamageSolver.CalculateValue(payload.damage.health);

        ownerCombatBus.FireSync("PreHealthDamageDeal", 1, false, payload);
        targetCombatBus.FireSync(`PreHealthDamageTake`, 1, true, payload);

        target_entity.SetState(
            `Health`,
            math.clamp(
                (target_entity.GetState(`Health`) as number) - finalHealthDamage,
                0.001,
                target_entity.GetState(`MaxHealth`) as number,
            ),
        );

        ownerCombatBus.FireSync("HealthDamageDeal", 1, false, payload);
        targetCombatBus.FireSync(`HealthDamageTake`, 1, true, payload);

        ownerDamageSolver.RemoveSolverNumbers();

        ownerCombatBus.FireSync("AfterHealthDamageDeal", 1, false, payload);
        targetCombatBus.FireSync(`AfterHealthDamageTake`, 1, true, payload);

        statusEffectsAPI.CreateStatus("Stun", { duration: 0.55 }, true, payload.targetId);

        traceClipAPI.log(
            payload.targetId,
            "Proc",
            `${payload.ownerId} Damaged ${payload.targetId}`,
            { sourceId: payload.ownerId, targetId: payload.targetId },
        );

        if (!characterName) return;

        ServerSignals.LaunchVFX.broadcast(
            characterName,
            "Hit",
            payload.targetId,
            target_character,
            payload.miscData.get(`CurrentClick`)! as number,
            Workspace.GetServerTimeNow(),
        );
    });
};
