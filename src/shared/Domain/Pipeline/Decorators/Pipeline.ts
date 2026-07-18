// ─────────────────────────────────────────────
//  Pipeline / Decorators / Pipeline.ts
// ─────────────────────────────────────────────

import { PipelineStepRegistry } from "../Components/PipelineStepRegistry";

import type {
    IPipelineStep,
    PipelineContextData,
    PipelineStepDecoratorProps,
} from "../Types/PipelineTypes";

const registry = PipelineStepRegistry.getInstance();

/**
 * Декоратор, который автоматически регистрирует шаг в глобальном реестре.
 *
 * @example
 * ```ts
 * @Pipeline({ Pipeline: "Player" })
 * export class LoadDataStep extends PipelineStep<PlayerContext> {
 *     public readonly Id = "LoadData";
 *
 *     public Execute(ctx: PipelineContext<PlayerContext>) {
 *         const handler = new DataHandler(ctx.Data.player);
 *         handler.Load();
 *         ctx.Set("DataHandler", handler);
 *     }
 * }
 * ```
 *
 * Работает с токеном:
 * ```ts
 * @Pipeline({ Pipeline: PlayerPipelineToken })
 * ```
 */
export function Pipeline(props: PipelineStepDecoratorProps) {
    return function <T extends new (...args: any[]) => IPipelineStep<PipelineContextData>>(
        ctor: T,
    ): T {
        const pipelineName = typeIs(props.Pipeline, "string")
            ? props.Pipeline
            : props.Pipeline.Name;

        // Создаём экземпляр шага.
        // Если шаг использует Flamework DI — передай его через конструктор
        // и создавай вручную в своём модуле инициализации, а не через декоратор.
        // Декоратор работает для «чистых» шагов без зависимостей.
        const instance = new ctor();

        registry.Register(pipelineName, instance);

        return ctor;
    };
}

/**
 * Создать типизированный токен для пайплайна.
 *
 * @example
 * ```ts
 * export const PlayerPipelineToken = CreatePipelineToken<PlayerContext>("Player");
 *
 * @Pipeline({ Pipeline: PlayerPipelineToken })
 * export class LoadDataStep extends PipelineStep<PlayerContext> { … }
 * ```
 */
export function CreatePipelineToken<TContext extends PipelineContextData>(
    name: string,
): { readonly Name: string; readonly _ctx?: TContext } {
    return { Name: name };
}
