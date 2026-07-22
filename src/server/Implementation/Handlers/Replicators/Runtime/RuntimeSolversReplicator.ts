import { ReplicatedAtomAggregate } from "shared/Domain/ReplicatedAtoms/Aggregates/ReplicatedAtomAggregate";
import { RegisterReplicator } from "shared/Domain/ReplicatedAtoms/Decorators/RegisterReplicator";
import { AtomPath, AtomPathValue } from "shared/Domain/ReplicatedAtoms_OLD/Types/AtomPathTypes";

import {
    SolverReplicationState,
    SolverSnapshot,
} from "shared/Types/Replicators/Runtime/RuntimeSolversState";

@RegisterReplicator()
export class RuntimeSolversReplicator extends ReplicatedAtomAggregate<SolverReplicationState> {
    constructor() {
        super("RuntimeSolvers", {});
    }

    public UpdateSolver(packName: string, solverName: string, snapshot: SolverSnapshot): void {
        this.Set(`${packName}/${solverName}` as never, snapshot as never);
    }

    public RemoveSolver(packName: string, solverName: string): void {
        this.Remove(`${packName}/${solverName}` as never);
    }

    public RemovePack(packName: string): void {
        this.Remove(packName as never);
    }
}
