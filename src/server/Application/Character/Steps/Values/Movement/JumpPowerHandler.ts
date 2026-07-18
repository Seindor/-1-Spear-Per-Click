import { RunService } from "@rbxts/services";

import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";
import { Janitor } from "@rbxts/janitor";
import { Service } from "@flamework/core";

let sharedScope = CompositionRootShared.createScope();

let entitiesStorageAPI = sharedScope.resolve(SharedRegistry.Singletons.API.EntitiesStorageAPI);
let solverAPI = sharedScope.resolve(SharedRegistry.Singletons.API.SolverAPI);
let janitorAPI = sharedScope.resolve(SharedRegistry.Singletons.API.JanitorAPI);

@Service()
export class JumpPowerHandler {
    public Init(ownerId: string) {
        let janitor = janitorAPI.Create(ownerId, `JumpPowerHandler`);
        let jumpPowerSolver = solverAPI.GetSolver(`JumpPower_Solver_${ownerId}`);

        janitor.Add(
            task.spawn(() => {
                while (jumpPowerSolver === undefined) {
                    jumpPowerSolver = solverAPI.GetSolver(`JumpPower_Solver_${ownerId}`);
                    task.wait(0.15);
                }

                jumpPowerSolver!.Subscribe(
                    ["Set", "Add", "Remove"],
                    `${ownerId}_JumpPower_Update`,
                    (...args: unknown[]) => {
                        let entity = entitiesStorageAPI.GetEntity(ownerId)!;
                        let character = entity.entity as Model;
                        let humanoid = character.WaitForChild("Humanoid") as Humanoid;

                        let newJumpPower = jumpPowerSolver!.CalculateValue(40);

                        humanoid.JumpPower = newJumpPower;
                        character.SetAttribute(`JumpPower`, newJumpPower);
                    },
                );
            }),
            true,
            `JumpPowerHandler`,
        );
    }
}
