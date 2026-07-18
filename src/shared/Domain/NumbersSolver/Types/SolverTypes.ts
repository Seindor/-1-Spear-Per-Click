export type phaseAlgorith = [
    "Flat",
    "Expression_Add",
    "Expression_Mult",
    "Expression_Divide",
][number];

export interface Phase {
    name: string;
    algorithm: phaseAlgorith;
    subAlgorithm: "Add" | "Multiply" | "Divide";
    priority: number;
}

export interface SolverNumber {
    sourceId: string;
    phaseName: string;
    value: number;
    tags: string[];
}

export interface SolverProperties {
    solverName?: string;
    phases: Phase[];
    tags?: string[];
}
