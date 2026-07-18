import { RunService } from "@rbxts/services";

import { Janitor } from "@rbxts/janitor";
import { Service } from "@flamework/core";

import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";
import { ServerRegistry } from "server/DI/Generated/ServerRegistry";
import { CompositionRootServer } from "server/DI/CompositionRootServer";
import { IStatusId } from "shared/Domain/Ability/Types/AbilityTypes";

let sharedScope = CompositionRootShared.createScope();
let serverScope = CompositionRootServer.createScope();

let entitiesStorageAPI = sharedScope.resolve(SharedRegistry.Singletons.API.EntitiesStorageAPI);
let statusEffectsAPI = serverScope.resolve(ServerRegistry.Singletons.API.StatusEffectsAPI);
let janitorAPI = sharedScope.resolve(SharedRegistry.Singletons.API.JanitorAPI);

let postureRegenerateBlacklist = [`CantRegeneratePosture`, `Dead`, `Stun`, `Block`] as IStatusId[];

@Service()
export class PostureHandler {
    public Init(ownerId: string) {
        let janitor = janitorAPI.Create(ownerId, `PosutreHandler`);
        let entity = entitiesStorageAPI.GetEntity(ownerId);

        if (!entity) return;

        entity.SetState(`MaxPosture`, 100);
        entity.SetState(`Posture`, 0);

        entity.SetState(`Posture_Regenerate_Amount`, 12.5);
        entity.SetState(`Posture_Regenerate_Time`, 1);

        janitor.Add(
            task.spawn(() => {
                while (true) {
                    if (!statusEffectsAPI.CheckStatuses(ownerId, postureRegenerateBlacklist)) {
                        let posture = entity.GetState(`Posture`) as number;
                        let regenerateamount = entity.GetState(
                            `Posture_Regenerate_Amount`,
                        ) as number;

                        let finalValue = math.clamp(
                            posture - regenerateamount,
                            0,
                            entity.GetState(`MaxPosture`) as number,
                        );

                        entity.SetState(`Posture`, finalValue);
                    }

                    task.wait(entity.GetState(`Posture_Regenerate_Time`) as number);
                }
            }),
            true,
            `Posture_Regenerate`,
        );
    }

    public Damage(ownerId: string, amount: number) {
        let entity = entitiesStorageAPI.GetEntity(ownerId);

        if (!entity) return;

        let posture = entity.GetState(`Posture`) as number;

        let finalValue = math.clamp(posture + amount, 0, entity.GetState(`MaxPosture`) as number);

        entity.SetState(`Posture`, finalValue);
    }

    public BlockBreaked(ownerId: string): boolean {
        let entity = entitiesStorageAPI.GetEntity(ownerId);

        if (!entity) return false;

        let posture = entity.GetState(`Posture`) as number;
        let maxPosture = entity.GetState(`MaxPosture`) as number;

        return posture >= maxPosture;
    }
}
