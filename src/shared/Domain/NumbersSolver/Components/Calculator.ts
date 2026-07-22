import {
    ResultAlgorithm,
    PhaseAlgorithm,
    Operation,
    Phase,
    RoundingMode,
    SolverNumber,
} from "../Types/SolverTypes";

export class Calculator {
    public CalculatePhase(currentNumber: number, numbers: SolverNumber[], phase: Phase): number {
        if (numbers.size() === 0) {
            return currentNumber;
        }

        const combined = this.CombinePhase(numbers, phase);

        let current = this.ApplyAlgorithm(currentNumber, combined, phase.resultAlgorithm);

        current = this.ApplyClamp(current, phase);
        current = this.ApplyRounding(current, phase.rounding);

        return current;
    }

    /**
     * Двухуровневое объединение с поддержкой переопределения оператора на
     * уровне отдельного числа (SolverNumber.operation / groupOperation).
     *
     * Если НИ ОДНО число группы не задаёт `operation` — группа считается
     * старым способом (Phase.groupAlgorithm: Add/Multiply/Average/Min/Max/First/Last),
     * поведение не отличается от версии без override.
     *
     * Если хотя бы одно число группы задаёт `operation` — группа считается
     * фолдом слева направо со своим оператором на каждом шаге:
     *   acc = v0; acc = acc OP1 v1; acc = acc OP2 v2; ...
     *
     * То же самое происходит на уровне фазы: результаты групп либо
     * объединяются одним Phase.phaseAlgorithm (старое поведение), либо,
     * если хотя бы у одной группы задан `groupOperation`, фолдятся
     * слева направо с индивидуальными операторами групп.
     */
    private CombinePhase(numbers: SolverNumber[], phase: Phase): number {
        const groups = this.GroupBySubgroup(numbers);
        const groupAlgorithm = phase.groupAlgorithm ?? "Add";
        const phaseAlgorithm = phase.phaseAlgorithm ?? "Add";

        const groupResults: { value: number; operation?: Operation }[] = [];

        for (const [, groupNumbers] of groups) {
            const hasOverride = groupNumbers.some((n) => n.operation !== undefined);

            const value = hasOverride
                ? this.Fold(groupNumbers, groupAlgorithm, (n) => n.operation)
                : this.Aggregate(
                      groupNumbers.map((n) => n.value),
                      groupAlgorithm,
                  );

            // groupOperation достаточно указать на любом числе группы;
            // если задано у нескольких — побеждает последнее по порядку.
            let groupOperation: Operation | undefined;
            for (const num of groupNumbers) {
                if (num.groupOperation !== undefined) groupOperation = num.groupOperation;
            }

            groupResults.push({ value, operation: groupOperation });
        }

        const anyGroupOverride = groupResults.some((g) => g.operation !== undefined);

        if (anyGroupOverride) {
            let acc = groupResults[0].value;

            for (let i = 1; i < groupResults.size(); i++) {
                const op = groupResults[i].operation ?? this.ToOperation(phaseAlgorithm);
                acc = this.ApplyAlgorithm(acc, groupResults[i].value, op);
            }

            return acc;
        }

        return this.Aggregate(
            groupResults.map((g) => g.value),
            phaseAlgorithm,
        );
    }

    private GroupBySubgroup(numbers: SolverNumber[]): Map<string, SolverNumber[]> {
        const groups = new Map<string, SolverNumber[]>();

        for (const number of numbers) {
            // Нет group -> число само себе группа (sourceId уникален,
            // так что коллизий с чужими группами не будет).
            const key = number.group ?? number.sourceId;
            const list = groups.get(key);

            if (list) {
                list.push(number);
                continue;
            }

            groups.set(key, [number]);
        }

        return groups;
    }

    /**
     * Фолд с индивидуальными операторами: acc = v0; acc = acc OP v1; acc = acc OP v2; ...
     * Оператор каждого числа (кроме самого первого — оно только "сеет" аккумулятор)
     * берётся из opSelector(number), а если не задан — из defaultAlgorithm фазы,
     * сконвертированного в Operation через ToOperation.
     */
    private Fold(
        numbers: SolverNumber[],
        defaultAlgorithm: PhaseAlgorithm,
        opSelector: (n: SolverNumber) => Operation | undefined,
    ): number {
        const defaultOp = this.ToOperation(defaultAlgorithm);
        let acc = numbers[0].value;

        for (let i = 1; i < numbers.size(); i++) {
            const num = numbers[i];
            const op = opSelector(num) ?? defaultOp;
            acc = this.ApplyAlgorithm(acc, num.value, op);
        }

        return acc;
    }

    /** Старое поведение "объединить список чисел одним алгоритмом" — без переопределений. */
    private Aggregate(values: number[], algorithm: PhaseAlgorithm): number {
        switch (algorithm) {
            case "Add": {
                let total = 0;

                for (const value of values) {
                    total += value;
                }

                return total;
            }

            case "Multiply": {
                let total = 1;

                for (const value of values) {
                    total *= value;
                }

                return total;
            }

            case "Average": {
                let total = 0;

                for (const value of values) {
                    total += value;
                }

                return total / values.size();
            }

            case "Min": {
                let result = values[0];

                for (const value of values) {
                    result = math.min(result, value);
                }

                return result;
            }

            case "Max": {
                let result = values[0];

                for (const value of values) {
                    result = math.max(result, value);
                }

                return result;
            }

            case "First":
                return values[0];

            case "Last":
                return values[values.size() - 1];
        }
    }

    /**
     * PhaseAlgorithm -> Operation. Нужен, когда группа/фаза с переопределениями
     * должна использовать Phase.groupAlgorithm/phaseAlgorithm как базовый
     * оператор по умолчанию для чисел БЕЗ override. Average/First/Last не имеют
     * смысла как "оператор для одного шага фолда", поэтому в этом случае
     * используется "Add" — с предупреждением, чтобы это не осталось незамеченным.
     */
    private ToOperation(algorithm: PhaseAlgorithm): Operation {
        switch (algorithm) {
            case "Add":
                return "Add";

            case "Multiply":
                return "Multiply";

            case "Min":
                return "Min";

            case "Max":
                return "Max";

            case "Average":
            case "First":
            case "Last":
                warn(
                    `[Calculator] "${algorithm}" нельзя использовать как базовый оператор для чисел с operation override — используется "Add"`,
                );
                return "Add";
        }
    }

    private ApplyAlgorithm(current: number, value: number, algorithm: Operation): number {
        switch (algorithm) {
            case "Add":
                return current + value;

            case "Subtract":
                return current - value;

            case "Multiply":
                return current * value;

            case "Divide":
                return value === 0 ? current : current / value;

            case "Power":
                return math.pow(current, value);

            case "Set":
                return value;

            case "Min":
                return math.max(current, value);

            case "Max":
                return math.min(current, value);
        }
    }

    private ApplyClamp(current: number, phase: Phase): number {
        let result = current;

        if (phase.clampMin !== undefined) {
            result = math.max(result, phase.clampMin);
        }

        if (phase.clampMax !== undefined) {
            result = math.min(result, phase.clampMax);
        }

        return result;
    }

    private ApplyRounding(current: number, rounding?: RoundingMode): number {
        switch (rounding) {
            case "Floor":
                return math.floor(current);

            case "Ceil":
                return math.ceil(current);

            case "Round":
                return math.round(current);

            default:
                return current;
        }
    }
}
