import { Workspace } from "@rbxts/services";

import { PhaseResolverContext } from "shared/Domain/PhaseResolver/Types/PhaseResolverTypes";

import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";
import { ServerRegistry } from "server/DI/Generated/ServerRegistry";
import { CompositionRootServer } from "server/DI/CompositionRootServer";
import { ServerSignals } from "shared/Implementation/Entities/SerrverSignals";
import { Default_M1_HitContext } from "../Contexts/Default_M1_HitContext";
import { Default_HitContext } from "../Contexts/Default_HitContext";

const sharedScope = CompositionRootShared.createScope();
const serverScope = CompositionRootServer.createScope();

let phaseResolverAPI = sharedScope.resolve(SharedRegistry.Singletons.API.PhaseResolverAPI);
let gameEffectsAPI = serverScope.resolve(ServerRegistry.Singletons.API.GameEffectsAPI);
let statusEffectsAPI = serverScope.resolve(ServerRegistry.Singletons.API.StatusEffectsAPI);
let traceClipAPI = sharedScope.resolve(SharedRegistry.Singletons.API.TraceClipAPI);
let entitiesStorageAPI = sharedScope.resolve(SharedRegistry.Singletons.API.EntitiesStorageAPI);

export const Default_M1_Resolver = (ownerId: string) => {
    let default_M1_Resolver = phaseResolverAPI.CreateResolver<Default_HitContext>({
        ownerId: ownerId,
        resolverName: "Default_M1_Resolver",
        phases: [
            {
                name: "Counter",
                priority: 5,
                onCheck: (ctx) => {
                    if (
                        statusEffectsAPI.CheckStatuses(
                            ctx.ownerId,
                            ctx.ability.GetBlacklist(),
                            ctx.ability.config.ignoreList ?? [],
                        )
                    ) {
                        return false;
                    }

                    return statusEffectsAPI.HasStatus(ctx.targetId, "Counter");
                },
                onSuccess: (ctx, emit) => {},
            },
            {
                name: "Dodge",
                priority: 4,
                onCheck: (ctx) => {
                    if (
                        statusEffectsAPI.CheckStatuses(
                            ctx.ownerId,
                            ctx.ability.GetBlacklist(),
                            ctx.ability.config.ignoreList ?? [],
                        )
                    ) {
                        return false;
                    }
                    return statusEffectsAPI.HasStatus(ctx.targetId, "Dodge");
                },
                onSuccess: (ctx, emit) => {
                    emit({ effectType: "Default_Dodge_Effect", queuePriority: 1, payload: ctx });
                },
            },
            {
                name: "Parry",
                priority: 3,
                onCheck: (ctx) => {
                    if (
                        statusEffectsAPI.CheckStatuses(
                            ctx.ownerId,
                            ctx.ability.GetBlacklist(),
                            ctx.ability.config.ignoreList ?? [],
                        )
                    ) {
                        return false;
                    }
                    return statusEffectsAPI.HasStatus(ctx.targetId, "Parry");
                },
                onSuccess: (ctx, emit) => {
                    emit({ effectType: "Default_Parry_Effect", queuePriority: 1, payload: ctx });
                },
            },
            {
                name: "Block",
                priority: 2,
                onCheck: (ctx) => {
                    let owner_entity = entitiesStorageAPI.GetEntity(ctx.ownerId)!;
                    let target_entity = entitiesStorageAPI.GetEntity(ctx.targetId)!;

                    let owner_character = owner_entity.entity as Model;
                    let owner_humanoidRootPart = owner_character.FindFirstChild(
                        "HumanoidRootPart",
                    ) as BasePart;

                    let target_character = target_entity.entity as Model;
                    let target_humanoidRootPart = target_character.FindFirstChild(
                        "HumanoidRootPart",
                    ) as BasePart;

                    if (
                        statusEffectsAPI.CheckStatuses(
                            ctx.ownerId,
                            ctx.ability.GetBlacklist(),
                            ctx.ability.config.ignoreList ?? [],
                        )
                    ) {
                        return false;
                    }

                    if (!statusEffectsAPI.HasStatus(ctx.targetId, "Block")) return false;
                    if (statusEffectsAPI.HasStatus(ctx.targetId, `BlockBreak`)) return false;

                    let targetLookVector = target_humanoidRootPart.CFrame.LookVector;
                    let directionToOwner = owner_humanoidRootPart.Position.sub(
                        target_humanoidRootPart.Position,
                    ).Unit;

                    let dot = targetLookVector.Dot(directionToOwner);

                    if (dot < 0.2) {
                        return false;
                    } else {
                        return true;
                    }
                },
                onSuccess: (ctx, emit) => {
                    emit({ effectType: "Default_Block_Effect", queuePriority: 1, payload: ctx });
                },
            },
            {
                name: "Damage",
                priority: 1,
                onCheck: (ctx) => {
                    if (
                        statusEffectsAPI.CheckStatuses(
                            ctx.ownerId,
                            ctx.ability.GetBlacklist(),
                            ctx.ability.config.ignoreList ?? [],
                        )
                    ) {
                        return false;
                    }

                    if (statusEffectsAPI.CheckStatuses(ctx.targetId, [`iFrame`, `Dodged`])) {
                        return false;
                    }

                    return true;
                },
                onSuccess: (ctx, emit) => {
                    emit({
                        effectType: "Default_M1_Damage_Effect",
                        queuePriority: 1,
                        payload: ctx,
                    });
                },
            },
        ],
    });
};
