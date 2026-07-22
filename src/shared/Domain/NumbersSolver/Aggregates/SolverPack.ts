import { SolverAggregate } from "./SolverAggregate";
import { SolverProperties } from "../Types/SolverTypes";

/**
 * Пак — это именованная группа солверов, обычно "на одного игрока":
 *
 *   const pack = solverAPI.NewPack(`Player_${userId}`);
 *   const wins = pack.CreateSolver({ solverName: "Wins", phases: [...] });
 *   const strength = pack.CreateSolver({ solverName: "Strength", phases: [...] });
 *
 * Внутри пака имена солверов ("Wins", "Strength") можно использовать
 * короткими и одинаковыми для всех игроков — уникальность обеспечивает
 * сам пак, а не строковые префиксы вида `Player_123_Wins`.
 */
export class SolverPack {
    public name: string;
    public solvers = new Map<string, SolverAggregate>();

    constructor(name: string) {
        this.name = name;
    }

    public CreateSolver(properties: SolverProperties, overwrite?: boolean): SolverAggregate {
        const solverName = properties.solverName ?? "Unknown Solver";

        if (this.solvers.has(solverName)) {
            if (overwrite) {
                this.RemoveSolver(solverName);
            } else {
                return this.solvers.get(solverName)!;
            }
        }

        const solver = new SolverAggregate(properties);
        this.solvers.set(solver.name, solver);

        return solver;
    }

    public GetSolver(solverName: string): SolverAggregate | undefined {
        if (this.solvers.has(solverName)) {
            return this.solvers.get(solverName);
        }

        warn(`Cannot find "${solverName}" in pack "${this.name}" to return.`);
        return;
    }

    public RemoveSolver(solverName: string) {
        if (this.solvers.has(solverName)) {
            const solver = this.solvers.get(solverName)!;

            solver.Destroy();
            this.solvers.delete(solverName);

            return;
        }

        warn(`Cannot find "${solverName}" in pack "${this.name}" to remove.`);
    }

    /** Все солверы пака разом — удобно для дебаг-панели "показать все статы игрока" */
    public GetAllSolvers(): SolverAggregate[] {
        const result: SolverAggregate[] = [];
        for (const [, solver] of this.solvers) result.push(solver);
        return result;
    }

    /** Уничтожает все солверы пака. Дёргать при PlayerRemoving. */
    public Destroy() {
        for (const [, solver] of this.solvers) {
            solver.Destroy();
        }

        this.solvers.clear();
    }
}
