import { Workspace } from "@rbxts/services";

import { PhaseResolverContext } from "shared/Domain/PhaseResolver/Types/PhaseResolverTypes";

import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";
import { ServerRegistry } from "server/DI/Generated/ServerRegistry";
import { CompositionRootServer } from "server/DI/CompositionRootServer";
import { ServerSignals } from "shared/Implementation/Entities/SerrverSignals";
import { Default_M1_HitContext } from "../Contexts/Default_M1_HitContext";

const sharedScope = CompositionRootShared.createScope();
const serverScope = CompositionRootServer.createScope();

let phaseResolverAPI = sharedScope.resolve(SharedRegistry.Singletons.API.PhaseResolverAPI);
let gameEffectsAPI = serverScope.resolve(ServerRegistry.Singletons.API.GameEffectsAPI);
let statusEffectsAPI = serverScope.resolve(ServerRegistry.Singletons.API.StatusEffectsAPI);
let traceClipAPI = sharedScope.resolve(SharedRegistry.Singletons.API.TraceClipAPI);
let entitiesStorageAPI = sharedScope.resolve(SharedRegistry.Singletons.API.EntitiesStorageAPI);
let abilityAPI = sharedScope.resolve(SharedRegistry.Singletons.API.AbilityAPI);

export const Default_Parry_Effect = (ownerId: string) => {
    gameEffectsAPI.registerHandler("Default_Parry_Effect", (effect, ctx) => {
        const payload = effect.payload as Default_M1_HitContext;

        let owner_entity = entitiesStorageAPI.GetEntity(payload.ownerId)!;
        let owner_character = owner_entity.entity as Model;
        let owner_characterName = owner_entity.GetState("CharacterName") as string | undefined;

        let target_entity = entitiesStorageAPI.GetEntity(payload.targetId)!;
        let target_character = target_entity.entity as Model;
        let target_characterName = target_entity.GetState("CharacterName") as string | undefined;

        if (!owner_characterName) return;
        if (!target_characterName) return;

        let parryAbility = abilityAPI.Get(payload.targetId, `${target_characterName}_Parry`)!;

        parryAbility.config.lastUsed = 0;

        statusEffectsAPI.CreateStatus(
            `Stun`,
            { duration: 0.7, priority: 1 },
            true,
            payload.ownerId,
        );

        ServerSignals.LaunchVFX.broadcast(
            owner_characterName,
            "WasParried",
            payload.ownerId,
            owner_character,
            Workspace.GetServerTimeNow(),
        );

        ServerSignals.LaunchVFX.broadcast(
            target_characterName,
            "Parried",
            payload.targetId,
            target_character,
            Workspace.GetServerTimeNow(),
        );
    });
};
