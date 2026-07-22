import { Phase, PhaseBreakdown, SolverNumber, SolverProperties } from "../Types/SolverTypes";
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
    public miscData: Record<string, any> = {};

    // Map вместо массива: O(1) добавление/удаление/поиск по sourceId
    // вместо O(n) find()/findIndex() на каждый Add/Set/Remove.
    private phaseByName = new Map<string, Phase>();
    private numbersBySourceId = new Map<string, SolverNumber>();

    private subscribers = new Map<string, subscriber>();

    // Простой кэш: если между вызовами CalculateValue ничего не поменялось
    // (нет Add/Set/Remove/expired-чисел) и baseValue тот же — не пересчитываем.
    // Полезно, если CalculateValue дёргается каждый кадр из UI.
    private dirty = true;
    private cachedBaseValue?: number;
    private cachedResult?: number;

    constructor(properties: SolverProperties) {
        this.name = properties.solverName ?? "Unknown Solver";
        this.phases = properties.phases ?? [];
        this.tags = properties.tags ?? [];

        for (const phase of this.phases) {
            this.phaseByName.set(phase.name, phase);
        }
    }

    /** Текущий список чисел (для отладки/UI). Пересобирается на каждый вызов из Map. */
    public GetSolverNumbers(): SolverNumber[] {
        const result: SolverNumber[] = [];

        for (const [, num] of this.numbersBySourceId) {
            result.push(num);
        }

        return result;
    }

    public AddSolverNumber(solverNumber: SolverNumber, ...args: unknown[]) {
        if (!this.phaseByName.has(solverNumber.phaseName)) {
            warn(`Cannot find Phase: ${solverNumber.phaseName} in ${this.name}`);
            return;
        }

        if (this.numbersBySourceId.has(solverNumber.sourceId)) return;

        this.numbersBySourceId.set(solverNumber.sourceId, solverNumber);
        this.MarkDirty();
        this.notify("Add", ...args);
    }

    public SetSolverNumber(solverNumber: SolverNumber, ...args: unknown[]) {
        if (!this.phaseByName.has(solverNumber.phaseName)) {
            warn(`Cannot find Phase: ${solverNumber.phaseName} in ${this.name}`);
            return;
        }

        this.numbersBySourceId.set(solverNumber.sourceId, solverNumber);
        this.MarkDirty();
        this.notify("Set", ...args);
    }

    public ReplaceAllSolverNumbers(numbers: SolverNumber[]) {
        this.numbersBySourceId.clear();

        for (const num of numbers) {
            if (!this.phaseByName.has(num.phaseName)) {
                warn(
                    `Cannot find Phase: ${num.phaseName} in ${this.name} (ReplaceAllSolverNumbers)`,
                );
                continue;
            }

            this.numbersBySourceId.set(num.sourceId, num);
        }

        this.MarkDirty();
        this.notify("Set");
    }

    public RemoveSolverNumber(sourceId: string, ...args: unknown[]) {
        if (!this.numbersBySourceId.has(sourceId)) return;

        this.numbersBySourceId.delete(sourceId);
        this.MarkDirty();
        this.notify("Remove", ...args);
    }

    public RemoveSolverNumbers(...args: unknown[]) {
        this.numbersBySourceId.clear();
        this.MarkDirty();
        this.notify("Remove", ...args);
    }

    /** Основной расчёт. Прогоняет baseValue через все фазы по приоритету. */
    public CalculateValue(baseValue: number, ...args: unknown[]): number {
        if (this.PruneExpired()) this.MarkDirty();

        if (!this.dirty && this.cachedBaseValue === baseValue && this.cachedResult !== undefined) {
            return this.cachedResult;
        }

        const numbersByPhase = this.GetNumbersByPhase();
        const sortedPhases = [...this.phases].sort((a, b) => a.priority < b.priority);

        let current = baseValue;

        for (const phase of sortedPhases) {
            const numbers = numbersByPhase.get(phase.name);
            if (!numbers || numbers.size() === 0) continue;

            current = this.calculator.CalculatePhase(current, numbers, phase);
        }

        this.dirty = false;
        this.cachedBaseValue = baseValue;
        this.cachedResult = current;

        this.notify("Calculate", ...args);

        return current;
    }

    /**
     * То же самое, что CalculateValue, но возвращает значение "до/после"
     * на каждой фазе + какие именно числа в неё внесли вклад.
     * Не кэшируется — предназначен для дебаг-панелей, а не для хот-пути.
     */
    public GetBreakdown(baseValue: number): PhaseBreakdown[] {
        this.PruneExpired();

        const numbersByPhase = this.GetNumbersByPhase();
        const sortedPhases = [...this.phases].sort((a, b) => a.priority < b.priority);

        const breakdown: PhaseBreakdown[] = [];
        let current = baseValue;

        for (const phase of sortedPhases) {
            const numbers = numbersByPhase.get(phase.name) ?? [];
            const before = current;

            if (numbers.size() > 0) {
                current = this.calculator.CalculatePhase(current, numbers, phase);
            }

            breakdown.push({
                phaseName: phase.name,
                before,
                after: current,
                contributions: numbers,
            });
        }

        return breakdown;
    }

    /** Удаляет протухшие (expiresAt <= now) числа. Возвращает true, если что-то удалено. */
    private PruneExpired(): boolean {
        const now = os.time();
        let prunedAny = false;

        for (const [sourceId, num] of this.numbersBySourceId) {
            if (num.expiresAt !== undefined && num.expiresAt <= now) {
                this.numbersBySourceId.delete(sourceId);
                prunedAny = true;
            }
        }

        return prunedAny;
    }

    private MarkDirty() {
        this.dirty = true;
    }

    private GetNumbersByPhase(): Map<string, SolverNumber[]> {
        const numbersByPhase = new Map<string, SolverNumber[]>();

        for (const [, num] of this.numbersBySourceId) {
            const list = numbersByPhase.get(num.phaseName);

            if (list) {
                list.push(num);
                continue;
            }

            numbersByPhase.set(num.phaseName, [num]);
        }

        return numbersByPhase;
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
                        const [ok, err] = pcall(() => subscriber.callback(...args));
                        if (!ok) {
                            warn(`Subscriber "${index}" callback failed on ${methodId}: ${err}`);
                        }
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
