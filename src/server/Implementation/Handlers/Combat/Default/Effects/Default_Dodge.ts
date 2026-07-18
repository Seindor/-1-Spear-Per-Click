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

export const Default_Dodge_Effect = (ownerId: string) => {
    gameEffectsAPI.registerHandler("Default_Dodge_Effect", (effect, ctx) => {
        const payload = effect.payload as Default_HitContext;

        let entity = entitiesStorageAPI.GetEntity(payload.targetId);
        if (!entity) {
            return;
        }
        let character = entity.entity as Model;
        let characterName = entity.GetState("CharacterName") as string | undefined;

        if (!characterName) return;

        if (statusEffectsAPI.HasStatus(payload.targetId, `Dodged`)) return;

        statusEffectsAPI.CreateStatus(`Dodged`, { duration: 0.4 }, true, payload.targetId);
        statusEffectsAPI.CreateStatus(`iFrame`, { duration: 0.55 }, true, payload.targetId);

        ServerSignals.LaunchVFX.broadcast(
            characterName,
            "Dodge",
            payload.targetId,
            character,
            Workspace.GetServerTimeNow(),
        );
    });
};
