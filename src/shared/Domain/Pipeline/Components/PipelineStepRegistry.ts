// ─────────────────────────────────────────────
//  Pipeline / Components / PipelineStepRegistry.ts
// ─────────────────────────────────────────────

import type { IPipelineStep, PipelineContextData } from "../Types/PipelineTypes";

/**
 * Глобальный реестр шагов.
 * Декоратор @Pipeline пишет сюда, PipelineService читает отсюда при создании пайплайна.
 */
export class PipelineStepRegistry {
    private static readonly instance = new PipelineStepRegistry();
    public static getInstance(): PipelineStepRegistry {
        return PipelineStepRegistry.instance;
    }

    private readonly map = new Map<string, IPipelineStep<PipelineContextData>[]>();

    private constructor() {}

    /** Регистрирует шаг для пайплайна с данным именем */
    public Register(pipelineName: string, step: IPipelineStep<PipelineContextData>): void {
        let list = this.map.get(pipelineName);
        if (!list) {
            list = [];
            this.map.set(pipelineName, list);
        }

        if (list.some((s) => s.Id === step.Id)) {
            warn(
                `[PipelineStepRegistry] Step "${step.Id}" already registered for "${pipelineName}" — skipping`,
            );
            return;
        }

        list.push(step);
    }

    /** Возвращает все зарегистрированные шаги для пайплайна */
    public GetSteps(pipelineName: string): IPipelineStep<PipelineContextData>[] {
        return this.map.get(pipelineName) ?? [];
    }

    /** Все зарегистрированные имена пайплайнов */
    public GetPipelineNames(): string[] {
        const names: string[] = [];
        for (const [name] of this.map) names.push(name);
        return names;
    }
}
