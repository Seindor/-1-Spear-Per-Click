import { StatusAggregateType, StatusDefinition } from "../Types/StatusTypes";

import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";

let sharedScope = CompositionRootShared.createScope();

let solverAPI = sharedScope.resolve(SharedRegistry.Singletons.API.SolverAPI);
let entitiesStorageAPI = sharedScope.resolve(SharedRegistry.Singletons.API.EntitiesStorageAPI);

const walkSpeeds = {
    1: 0.15,
    2: 0,
};

export const Stun: StatusDefinition = {
    id: "Stun",
    duration: 1,

    stackingPolicy: "Refresh",

    defaultBlacklist: [{ id: "HyperArmor" }, { id: "iFrame" }],

    defaultModifiers: [
        { stat: "WalkSpeed", type: "Override", value: 0 },
        { stat: "JumpPower", type: "Override", value: 0 },
    ],

    onAdded: (actorId: string, statusInstance?: StatusAggregateType) => {
        let walkSpeedSolver = solverAPI.GetSolver(`WalkSpeed_Solver_${actorId}`)!;
        let jumpPowerSolver = solverAPI.GetSolver(`JumpPower_Solver_${actorId}`)!;

        walkSpeedSolver.SetSolverNumber({
            sourceId: "Stun",
            phaseName: "Multiplier2",
            value: walkSpeeds[statusInstance?.priority as keyof typeof walkSpeeds] ?? 0,
            tags: ["Stun"],
        });

        jumpPowerSolver.SetSolverNumber({
            sourceId: "Stun",
            phaseName: "Multiplier2",
            value: 0,
            tags: ["Stun"],
        });
    },
    onRemoved: (actorId: string, statusInstance?: StatusAggregateType) => {
        let walkSpeedSolver = solverAPI.GetSolver(`WalkSpeed_Solver_${actorId}`)!;
        let jumpPowerSolver = solverAPI.GetSolver(`JumpPower_Solver_${actorId}`)!;

        walkSpeedSolver.RemoveSolverNumber("Stun");
        jumpPowerSolver.RemoveSolverNumber("Stun");
    },
    onCheck: (actorId: string, statusInstance?: StatusAggregateType) => {},
};
