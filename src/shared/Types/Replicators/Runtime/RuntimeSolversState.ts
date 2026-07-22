import { Phase, SolverNumber } from "shared/Domain/NumbersSolver/Types/SolverTypes";

/** Снимок одного солвера — конфиг фаз + текущий список чисел. */
export interface SolverSnapshot {
    phases: Phase[];
    numbers: SolverNumber[];
}

/** Все солверы одного пака: solverName -> снимок. */
export type SolverPackSnapshot = Record<string, SolverSnapshot>;

/** Состояние всего репликатора: packName (обычно actorId) -> его паки. */
export type SolverReplicationState = Record<string, SolverPackSnapshot>;
