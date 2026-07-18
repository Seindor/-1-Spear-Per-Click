import { Phase, SolverNumber, SolverProperties } from "../Types/SolverTypes";
import { Calculator as _Calculator } from "../Components/Calculator";
import { TableHelper } from "shared/Utilities/TableHelper";
import { Janitor } from "@rbxts/janitor";

type method = ["Set", "Add", "Remove", "Calculate"][number];

type subscriber = {
    methods: method[];
    callback: Callback;
};

export class SolverAggregate {
    private calculator = new _Calculator();
    public _janitor = new Janitor<any>();

    public name: string;
    public phases: Phase[];
    public tags: string[];
    public solverNumbers: SolverNumber[] = [];
    public miscData: Record<string, any> = {};

    private subscribers = new Map<string, subscriber>();

    constructor(properties: SolverProperties) {
        this.name = properties.solverName ?? "Unknown Solver";
        this.phases = properties.phases ?? [];
        this.tags = properties.tags ?? [];
    }

    public AddSolverNumber(solverNumber: SolverNumber, ...args: unknown[]) {
        const phase = this.phases.find((_phase) => _phase.name === solverNumber.phaseName);
        if (!phase) {
            warn(`Cannot find Phase: ${solverNumber.phaseName} in ${this.name}`);
            return;
        }

        const exist = this.solverNumbers.find(
            (_number) => _number.sourceId === solverNumber.sourceId,
        );

        if (!exist) {
            this.solverNumbers.push(solverNumber);
            this.notify("Add", ...args);
        }
    }

    public SetSolverNumber(solverNumber: SolverNumber, ...args: unknown[]) {
        const phase = this.phases.find((_phase) => _phase.name === solverNumber.phaseName);
        if (!phase) {
            warn(`Cannot find Phase: ${solverNumber.phaseName} in ${this.name}`);
            return;
        }

        const index = this.solverNumbers.findIndex(
            (_number) => _number.sourceId === solverNumber.sourceId,
        );

        if (index === -1) {
            this.solverNumbers.push(solverNumber);
            this.notify("Set", ...args);
            return;
        }

        this.solverNumbers[index] = solverNumber;
        this.notify("Set", ...args);
    }

    public RemoveSolverNumber(sourceId: string, ...args: unknown[]) {
        const index = this.solverNumbers.findIndex((_number) => _number.sourceId === sourceId);
        if (index === -1) return;

        this.solverNumbers.remove(index);
        this.notify("Remove", ...args);
    }

    public RemoveSolverNumbers(...args: unknown[]) {
        this.solverNumbers = [];

        this.notify("Remove", ...args);
    }

    public CalculateValue(baseValue: number, ...args: unknown[]): number {
        const valuesByPhase = this.GetValuesByPhase();
        const sortedPhases = [...this.phases].sort((a, b) => a.priority < b.priority);

        let current = baseValue;

        for (const phase of sortedPhases) {
            const values = valuesByPhase.get(phase.name);
            if (!values || values.size() === 0) continue;

            current = this.calculator.CalculatePhase(
                current,
                values,
                phase.algorithm,
                phase.subAlgorithm,
            );
        }

        this.notify("Calculate", ...args);

        return current;
    }

    private GetValuesByPhase(): Map<string, number[]> {
        const valuesByPhase = new Map<string, number[]>();

        for (const solverNumber of this.solverNumbers) {
            const values = valuesByPhase.get(solverNumber.phaseName);

            if (values) {
                values.push(solverNumber.value);
                continue;
            }

            valuesByPhase.set(solverNumber.phaseName, [solverNumber.value]);
        }

        return valuesByPhase;
    }

    public Subscribe(methods: method[], indexName: string, callBack: Callback) {
        if (this.subscribers.has(indexName)) {
            this.Unsubscribe(indexName);
        }

        this.subscribers.set(indexName, { methods: methods, callback: callBack });
    }

    public Unsubscribe(indexName: string) {
        if (!this.subscribers.has(indexName)) return;

        this.subscribers.delete(indexName);
    }

    private notify(methodId: method, ...args: unknown[]) {
        for (const [index, subscriber] of this.subscribers) {
            if (subscriber.methods.includes(methodId)) {
                this._janitor.Add(
                    task.spawn(() => {
                        subscriber.callback(...args);
                    }),
                    true,
                    `${index}_${methodId}_Callback`,
                );
            }
        }
    }

    public Destroy() {
        this._janitor.Cleanup();
        TableHelper.ClearTable(this);
    }
}
