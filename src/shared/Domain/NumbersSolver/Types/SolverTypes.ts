/**
 * Как объединить все значения внутри одной ГРУППЫ (или всей фазы, если группы не используются),
 * когда НИ ОДНО число в ней не переопределяет свой оператор через SolverNumber.operation.
 *
 * Пример:
 * Values = [2, 3, 4]
 *
 * Add       -> 9
 * Multiply  -> 24
 * Average   -> 3
 * Min       -> 2
 * Max       -> 4
 * First     -> 2
 * Last      -> 4
 */
export type PhaseAlgorithm = "Add" | "Multiply" | "Average" | "Min" | "Max" | "First" | "Last";

/**
 * Как применить результат фазы к текущему значению.
 *
 * current = 100
 * combined = 20
 *
 * Add       -> 120
 * Subtract  -> 80
 * Multiply  -> 2000
 * Divide    -> 5
 * Power     -> 100^20
 * Set        -> 20
 * Min        -> math.max(current, combined)
 * Max        -> math.min(current, combined)
 */
export type ResultAlgorithm =
    | "Add"
    | "Subtract"
    | "Multiply"
    | "Divide"
    | "Power"
    | "Set"
    | "Min"
    | "Max";

/**
 * Тот же набор операций, что и ResultAlgorithm. Используется там, где ОТДЕЛЬНОЕ
 * число само задаёт, каким оператором оно сворачивается с накопленным результатом
 * (SolverNumber.operation / SolverNumber.groupOperation) — в отличие от PhaseAlgorithm,
 * этот набор состоит из чистых бинарных операций и поэтому годится для фолда
 * "слева направо со своим оператором на каждом шаге".
 */
export type Operation = ResultAlgorithm;

export type RoundingMode = "None" | "Floor" | "Ceil" | "Round";

export interface Phase {
    /** Уникальное имя фазы */
    name: string;

    /** Порядок выполнения */
    priority: number;

    /**
     * Как объединять числа ВНУТРИ одной группы (SolverNumber.group), если
     * ни одно число группы не переопределяет свой оператор через `operation`.
     *
     * По умолчанию "Add".
     */
    groupAlgorithm?: PhaseAlgorithm;

    /**
     * Как объединять результаты РАЗНЫХ групп между собой, если ни у одной
     * группы не задан `groupOperation`.
     *
     * Если group нигде не используется — каждое число это своя
     * собственная группа из одного элемента, и phaseAlgorithm
     * работает ровно так же, как раньше — объединяет все числа фазы напрямую.
     *
     * По умолчанию "Add".
     */
    phaseAlgorithm?: PhaseAlgorithm;

    /**
     * Как применить объединённое значение
     * к результату предыдущих фаз.
     */
    resultAlgorithm: ResultAlgorithm;

    rounding?: RoundingMode;

    clampMin?: number;
    clampMax?: number;
}

export interface SolverNumber {
    /** Уникальный источник числа */
    sourceId: string;

    /** Имя фазы */
    phaseName: string;

    /** Само значение */
    value: number;

    tags: string[];

    /** Для UI / дебага */
    displayName?: string;

    /** os.time() */
    expiresAt?: number;

    /** Пока зарезервировано */
    stackable?: boolean;
    maxStacks?: number;

    /**
     * Опционально: объединяет несколько чисел в общую подгруппу внутри фазы.
     * Если не задано — число считается отдельной группой само по себе.
     */
    group?: string;

    /**
     * Переопределяет оператор, с которым ИМЕННО ЭТО число сворачивается
     * с накопленным результатом внутри своей группы (или всей фазы, если
     * group не используется). Игнорируется у самого первого числа группы —
     * оно только "сеет" аккумулятор, ему не с чем сворачиваться.
     * Если не задано — берётся Phase.groupAlgorithm.
     *
     * Пример группы: [
     *   { value: 1 },                          // сеет аккумулятор: acc = 1
     *   { value: 1, operation: "Add" },         // acc = 1 + 1 = 2
     *   { value: 1, operation: "Subtract" },    // acc = 2 - 1 = 1
     *   { value: 1, operation: "Multiply" },    // acc = 1 * 1 = 1
     *   { value: 1, operation: "Divide" },      // acc = 1 / 1 = 1
     * ]
     * -> result: 1 + 1 - 1 * 1 / 1 = 1
     */
    operation?: Operation;

    /**
     * Переопределяет оператор, с которым РЕЗУЛЬТАТ ГРУППЫ этого числа
     * сворачивается с накопленным результатом фазы (между группами).
     * Достаточно задать на любом одном числе группы — если задано у
     * нескольких, побеждает последнее по порядку добавления. Игнорируется,
     * если группа этого числа оказалась самой первой в фазе.
     * Если не задано ни у кого в группе — берётся Phase.phaseAlgorithm.
     */
    groupOperation?: Operation;
}

export interface SolverProperties {
    solverName?: string;

    phases: Phase[];

    tags?: string[];
}

export interface PhaseBreakdown {
    phaseName: string;

    before: number;

    after: number;

    contributions: SolverNumber[];
}
