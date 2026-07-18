// import { Workspace } from "@rbxts/services";

// import { PhaseResolverContext } from "shared/Domain/PhaseResolver/Types/PhaseResolverTypes";

// import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
// import { CompositionRootShared } from "shared/DI/CompositionRootShared";
// import { ServerRegistry } from "server/DI/Generated/ServerRegistry";
// import { CompositionRootServer } from "server/DI/CompositionRootServer";
// import { ServerSignals } from "shared/Implementation/Entities/SerrverSignals";
// import { Default_HitContext } from "../Contexts/Default_HitContext";
// import { Dependency } from "@flamework/core";
// import { PostureHandler } from "server/Implementation/Handlers/Defense/PostureHandler";

// const sharedScope = CompositionRootShared.createScope();
// const serverScope = CompositionRootServer.createScope();

// let phaseResolverAPI = sharedScope.resolve(SharedRegistry.Singletons.API.PhaseResolverAPI);
// let gameEffectsAPI = serverScope.resolve(ServerRegistry.Singletons.API.GameEffectsAPI);
// let statusEffectsAPI = serverScope.resolve(ServerRegistry.Singletons.API.StatusEffectsAPI);
// let traceClipAPI = sharedScope.resolve(SharedRegistry.Singletons.API.TraceClipAPI);
// let entitiesStorageAPI = sharedScope.resolve(SharedRegistry.Singletons.API.EntitiesStorageAPI);

// export const Default_Block_Effect = (ownerId: string) => {
//     gameEffectsAPI.registerHandler("Default_Block_Effect", (effect, ctx) => {
//         let postureHandler = Dependency<PostureHandler>();
//         const payload = effect.payload as Default_HitContext;

//         let targetEntity = entitiesStorageAPI.GetEntity(payload.targetId);
//         if (!targetEntity) {
//             return;
//         }
//         let character = targetEntity.entity as Model;
//         let characterName = targetEntity.GetState("CharacterName") as string | undefined;

//         if (!payload.damage.posture) return;

//         postureHandler.Damage(payload.targetId, payload.damage.posture);

//         if (postureHandler.BlockBreaked(payload.targetId)) {
//             statusEffectsAPI.CreateStatus(`BlockBreak`, { duration: 2.5 }, true, payload.targetId);
//             statusEffectsAPI.CreateStatus(
//                 `Stun`,
//                 { duration: 2.5, priority: 2 },
//                 true,
//                 payload.targetId,
//             );

//             if (!characterName) return;

//             ServerSignals.LaunchVFX.broadcast(
//                 characterName,
//                 "BlockBreak",
//                 payload.targetId,
//                 character,
//                 Workspace.GetServerTimeNow(),
//                 Workspace.GetServerTimeNow() + 2.5,
//             );

//             return;
//         }

//         if (!characterName) return;

//         ServerSignals.LaunchVFX.broadcast(
//             characterName,
//             "BlockHit",
//             payload.targetId,
//             character,
//             Workspace.GetServerTimeNow(),
//         );
//     });
// };
