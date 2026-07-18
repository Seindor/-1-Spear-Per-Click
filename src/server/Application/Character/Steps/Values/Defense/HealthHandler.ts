import { RunService } from "@rbxts/services";

import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";
import { Janitor } from "@rbxts/janitor";
import { Service } from "@flamework/core";

let sharedScope = CompositionRootShared.createScope();

let entitiesStorageAPI = sharedScope.resolve(SharedRegistry.Singletons.API.EntitiesStorageAPI);

@Service()
export class HealthHandler {
    public Init(ownerId: string) {
        let entity = entitiesStorageAPI.GetEntity(ownerId);

        if (!entity) return;

        let character = entity.entity as Model;
        let humanoid = character.WaitForChild(`Humanoid`) as Humanoid;

        entity.SetState(`MaxHealth`, 100);
        entity.SetState(`Health`, 100);

        entity.SubscribeState(`Health`, `HealthChanged`, (oldValue: number, newValue: number) => {
            let valueToSet = math.clamp(newValue, 0.001, entity.GetState(`MaxHealth`) as number);

            humanoid.Health = valueToSet;
        });

        entity.SubscribeState(
            `MaxHealth`,
            `MaxHealthChanged`,
            (oldValue: number, newValue: number) => {
                let valueToSet = math.clamp(newValue, 0.001, math.huge);

                humanoid.MaxHealth = valueToSet;
            },
        );
    }
}
