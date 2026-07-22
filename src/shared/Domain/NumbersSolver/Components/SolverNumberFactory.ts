import { SolverNumber } from "../Types/SolverTypes";

type NumberOptions = Partial<
    Pick<
        SolverNumber,
        | "tags"
        | "displayName"
        | "expiresAt"
        | "stackable"
        | "maxStacks"
        | "group"
        | "operation"
        | "groupOperation"
    >
>;

/**
 * Factory отвечает только за создание SolverNumber.
 * Вся математика определяется Phase.groupAlgorithm / phaseAlgorithm / resultAlgorithm,
 * либо переопределяется точечно через options.operation / options.groupOperation.
 */
export namespace SolverNumberFactory {
    export function Create(
        sourceId: string,
        phaseName: string,
        value: number,
        options?: NumberOptions,
    ): SolverNumber {
        return {
            sourceId,
            phaseName,
            value,

            tags: options?.tags ?? [],

            displayName: options?.displayName,

            expiresAt: options?.expiresAt,

            stackable: options?.stackable,
            maxStacks: options?.maxStacks,

            group: options?.group,

            operation: options?.operation,
            groupOperation: options?.groupOperation,
        };
    }

    /**
     * Создает число, которое автоматически перестанет действовать
     * после указанного времени.
     */
    export function Temporary(
        sourceId: string,
        phaseName: string,
        value: number,
        durationSeconds: number,
        options?: NumberOptions,
    ): SolverNumber {
        return Create(sourceId, phaseName, value, {
            ...options,
            expiresAt: os.time() + durationSeconds,
        });
    }
}
