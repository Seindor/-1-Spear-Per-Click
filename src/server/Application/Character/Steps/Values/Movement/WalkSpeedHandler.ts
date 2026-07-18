import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";
import { Service } from "@flamework/core";

let sharedScope = CompositionRootShared.createScope();

let entitiesStorageAPI = sharedScope.resolve(SharedRegistry.Singletons.API.EntitiesStorageAPI);
let solverAPI = sharedScope.resolve(SharedRegistry.Singletons.API.SolverAPI);
let janitorAPI = sharedScope.resolve(SharedRegistry.Singletons.API.JanitorAPI);

@Service()
export class WalkSpeedHandler {
    public Init(ownerId: string) {
        let janitor = janitorAPI.Create(ownerId, `WalkSpeedHandler`);
        let walkSpeedSolver = solverAPI.GetSolver(`WalkSpeed_Solver_${ownerId}`);

        janitor.Add(
            task.spawn(() => {
                while (walkSpeedSolver === undefined) {
                    walkSpeedSolver = solverAPI.GetSolver(`WalkSpeed_Solver_${ownerId}`);
                    task.wait(0.15);
                }

                walkSpeedSolver!.Subscribe(
                    ["Set", "Add", "Remove"],
                    `${ownerId}_WalkSpeed_Update`,
                    (...args: unknown[]) => {
                        let entity = entitiesStorageAPI.GetEntity(ownerId)!;
                        let character = entity.entity as Model;
                        let humanoid = character.WaitForChild("Humanoid") as Humanoid;

                        let newSpeed = walkSpeedSolver!.CalculateValue(12);

                        humanoid.WalkSpeed = newSpeed;
                        character.SetAttribute(`WalkSpeed`, newSpeed);
                    },
                );
            }),
            true,
            `WalkSpeedHandler`,
        );
    }
}
