import { CreateDamageSolver } from "./DamageSolver";
import { CreateJumpPowerSolver } from "./JumpPowerSolver";
import { CreateWalkSpeedSolver } from "./WalkspeedSolver";

export const InitSolvers = (ownerId: string) => {
    let solvers = {
        damageSolver: CreateDamageSolver(ownerId),
        walkSpeedSolver: CreateWalkSpeedSolver(ownerId),
        jumpPowerSolver: CreateJumpPowerSolver(ownerId),
    };

    return solvers;
};
