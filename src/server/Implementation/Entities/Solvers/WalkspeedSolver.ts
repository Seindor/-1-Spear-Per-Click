import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";

import { SolverAggregate } from "shared/Domain/NumbersSolver/Aggregates/SolverAggregate";

const SharedScope = CompositionRootShared.createScope();

const SolverAPI = SharedScope.resolve(SharedRegistry.Singletons.API.SolverAPI);

export function CreateWalkSpeedSolver(solverId: string): SolverAggregate {
    let walkSpeedSolver = SolverAPI.CreateSolver({
        solverName: `WalkSpeed_Solver_${solverId}`,
        phases: [
            {
                name: "Flat",
                algorithm: "Flat",
                subAlgorithm: "Add",
                priority: 1,
            },

            {
                name: "Multiplier",
                algorithm: "Expression_Add",
                subAlgorithm: "Multiply",
                priority: 2,
            },

            {
                name: "Multiplier2",
                algorithm: "Expression_Mult",
                subAlgorithm: "Multiply",
                priority: 3,
            },

            {
                name: "Override",
                algorithm: "Expression_Add",
                subAlgorithm: "Multiply",
                priority: 999,
            },
        ],
    });
    return walkSpeedSolver;
}
