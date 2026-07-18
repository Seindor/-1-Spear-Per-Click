// ─────────────────────────────────────────────
//  Pipeline / Types / PipelineTypes.ts
// ─────────────────────────────────────────────

import type { PipelineContext } from "../Aggregates/PipelineContext";

/** Минимальные данные, которые каждый контекст должен содержать */
export interface PipelineContextData {
    readonly pipelineName: string;
    readonly id: string;
}

/** Токен — маркер конкретного пайплайна, несёт имя и тип контекста */
export interface PipelineToken<TContext extends PipelineContextData> {
    readonly Name: string;
    /** phantom type — только для вывода типов, в рантайме не используется */
    readonly _ctx?: TContext;
}

/** Что передаётся в декоратор @Pipeline */
export interface PipelineStepDecoratorProps {
    /** Имя пайплайна (строка) или типизированный токен */
    Pipeline: string | PipelineToken<any>;
}

export interface IStepConfig {
    launchParallel?: boolean;
}

/** Интерфейс шага, который хранится внутри PipelineAggregate */
export interface IPipelineStep<TContext extends PipelineContextData> {
    readonly Id: string;
    readonly Before: readonly string[];
    readonly After: readonly string[];
    readonly Config?: IStepConfig;

    Execute(ctx: PipelineContext<TContext>): void | Promise<void>;
}

/** Конфигурация пайплайна при создании */
export interface PipelineProperties {
    readonly Name: string;
}
