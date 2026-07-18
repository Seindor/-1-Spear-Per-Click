// ─────────────────────────────────────────────
//  Pipeline / Components / PipelineExecutor.ts
// ─────────────────────────────────────────────

import { Janitor } from "@rbxts/janitor";
import type { PipelineContext } from "../Aggregates/PipelineContext";
import type { IPipelineStep, PipelineContextData } from "../Types/PipelineTypes";

/**
 * Последовательно выполняет шаги.
 *
 * Если Execute бросает исключение — оно всплывает наверх и PipelineAggregate
 * вызывает OnError, после чего останавливает выполнение.
 */

export class PipelineExecutor {
    private _janitor = new Janitor<any>();

    public Execute<TContext extends PipelineContextData>(
        ctx: PipelineContext<TContext>,
        steps: IPipelineStep<TContext>[],
    ): void {
        ctx.Set(`LoadedSteps`, new Map<string, boolean>());

        let loadedSteps = ctx.Get(`LoadedSteps`) as Map<string, boolean>;

        for (const step of steps) {
            ctx.MarkLaunched(step.Id);
            if (step.Config?.launchParallel === true) {
                this._janitor.Add(
                    task.spawn(() => {
                        step.Execute(ctx);
                        loadedSteps.set(`${step.Id}/Loaded`, true);
                    }),
                    true,
                    `${step.Id}`,
                );
            } else {
                step.Execute(ctx);
                loadedSteps.set(`${step.Id}/Loaded`, true);
            }
        }
    }
}
