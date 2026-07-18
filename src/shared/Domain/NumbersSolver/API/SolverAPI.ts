import { SolverAggregate } from "../Aggregates/SolverAggregate";
import { SolverService } from "../Services/SolverService";
import { SolverProperties } from "../Types/SolverTypes";

export class SolverAPI {
    public service = new SolverService();

    public CreateSolver(properties: SolverProperties, overwrite?: boolean): SolverAggregate {
        return this.service.CreateSolver(properties, overwrite);
    }

    public GetSolver(solverName: string): SolverAggregate | undefined {
        return this.service.GetSolver(solverName);
    }

    public RemoveSolver(solverName: string) {
        this.service.RemoveSolver(solverName);
    }
}
