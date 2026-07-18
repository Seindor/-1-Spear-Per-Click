// ─────────────────────────────────────────────
//  Pipeline / Aggregates / PipelineStep.ts
// ─────────────────────────────────────────────

import type { PipelineContext } from "./PipelineContext";
import type { IPipelineStep, IStepConfig, PipelineContextData } from "../Types/PipelineTypes";

/**
 * Базовый класс для всех шагов.
 *
 * Подкласс обязан объявить:
 *   public readonly Id = "SomeStep";
 *   public Execute(ctx) { … }
 *
 * Опционально:
 *   public readonly Before = ["OtherStep"];
 *   public readonly After  = ["LoadData"];
 */
export abstract class PipelineStep<
    TContext extends PipelineContextData,
> implements IPipelineStep<TContext> {
    public abstract readonly Id: string;

    public readonly Before: readonly string[] = [];
    public readonly After: readonly string[] = [];
    public readonly Config?: IStepConfig | undefined;

    public abstract Execute(ctx: PipelineContext<TContext>): void | Promise<void>;
}
