import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";

const sharedScope = CompositionRootShared.createScope();

const solverAPI = sharedScope.resolve(SharedRegistry.Singletons.API.SolverAPI);

export function Create_Strength_Gain_Cooldown_Solver(ownerId: string) {
    let pack = solverAPI.NewPack(ownerId);

    let solver = pack.GetSolver(`Strength_Gain_Cooldown`);

    if (solver) return solver;

    solver = pack.CreateSolver({
        solverName: `Strength_Gain_Cooldown`,
        phases: [
            {
                name: "Flat",
                priority: 1,
                phaseAlgorithm: "Add",
                resultAlgorithm: "Add",
            },

            {
                name: "Multiply_Add",
                priority: 2,
                phaseAlgorithm: "Add",
                resultAlgorithm: "Multiply",
            },

            {
                name: "Multiply_Multiply",
                priority: 3,
                phaseAlgorithm: "Multiply",
                resultAlgorithm: "Multiply",
            },

            {
                name: "Power",
                priority: 4,
                phaseAlgorithm: "Add",
                resultAlgorithm: "Power",
            },

            {
                name: "Override",
                priority: 999,
                resultAlgorithm: "Set",
            },
        ],
    });

    return solver;
}
