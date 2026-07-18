import { Players } from "@rbxts/services";

import type { BootstrapStep } from "shared/Domain/Bootstrapper/Types/BootstrapTypes";
import type { CharacterBootstrapContext } from "../CharacterBootstrapContext";

import { InitSolvers } from "server/Implementation/Entities/Solvers";
import { StatusEffectsLog } from "server/Implementation/Handlers/StatusEffectsLog";

import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";
import { ServerRegistry } from "server/DI/Generated/ServerRegistry";
import { CompositionRootServer } from "server/DI/CompositionRootServer";

const sharedScope = CompositionRootShared.createScope();
const serverScope = CompositionRootServer.createScope();

const entitiesStorageAPI = sharedScope.resolve(SharedRegistry.Singletons.API.EntitiesStorageAPI);
const animationsAPI = sharedScope.resolve(SharedRegistry.Singletons.API.AnimationsAPI);
const hitboxAPI = sharedScope.resolve(SharedRegistry.Singletons.API.HitboxAPI);
const statusEffectsAPi = serverScope.resolve(ServerRegistry.Singletons.API.StatusEffectsAPI);

export class EntityInitStep implements BootstrapStep<CharacterBootstrapContext> {
    public name = "EntityInitStep";
    public priority = 1;

    public execute(ctx: CharacterBootstrapContext) {
        let entity = entitiesStorageAPI.AddEntity(ctx.id, ctx.character);

        InitSolvers(ctx.id);

        new StatusEffectsLog(ctx.id);
        statusEffectsAPi.RemoveAllStatuses(ctx.id);

        animationsAPI.RemoveActorAnimators(ctx.id);

        hitboxAPI.TrackModel(ctx.character);

        if (Players.GetPlayerFromCharacter(ctx.character)) {
            ctx.character.AddTag(`Player`);
            entity.AddTag(`Player`);
        } else {
            ctx.character.AddTag(`NPC`);
            entity.AddTag(`NPC`);
        }
    }
}
