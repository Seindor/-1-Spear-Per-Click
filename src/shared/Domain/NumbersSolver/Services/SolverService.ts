import { SolverProperties } from "../Types/SolverTypes";
import { SolverAggregate } from "../Aggregates/SolverAggregate";

export class SolverService {
    public solvers = new Map<string, SolverAggregate>();

    public CreateSolver(properties: SolverProperties, overwrite?: boolean): SolverAggregate {
        if (this.solvers.has(properties.solverName ?? "Unknown Solver")) {
            if (overwrite) {
                this.RemoveSolver(properties.solverName ?? "Unknown Solver");

                const solver = new SolverAggregate(properties);
                this.solvers.set(solver.name, solver);

                return solver;
            }

            return this.solvers.get(properties.solverName ?? "Unknown Solver")!;
        }

        const solver = new SolverAggregate(properties);
        this.solvers.set(solver.name, solver);

        return solver;
    }

    public GetSolver(solverName: string): SolverAggregate | undefined {
        if (this.solvers.has(solverName)) {
            return this.solvers.get(solverName);
        }

        warn(`Cannot find ${solverName} in map to return.`);
        return;
    }

    public RemoveSolver(solverName: string) {
        if (this.solvers.has(solverName)) {
            const solver = this.solvers.get(solverName)!;

            solver.Destroy();
            this.solvers.delete(solverName);

            return;
        }

        warn(`Cannot find ${solverName} in map to remove.`);
    }
}
