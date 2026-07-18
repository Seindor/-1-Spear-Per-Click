// ─────────────────────────────────────────────
//  Pipeline / Services / PipelineService.ts
// ─────────────────────────────────────────────

import { PipelineAggregate } from "../Aggregates/PipelineAggregate";
import { PipelineStepRegistry } from "../Components/PipelineStepRegistry";

import type { PipelineContextData } from "../Types/PipelineTypes";

/**
 * Управляет коллекцией пайплайнов.
 *
 * При создании пайплайна автоматически подгружает все шаги,
 * зарегистрированные через @Pipeline({ Pipeline: "Name" }).
 */
export class PipelineService {
    private readonly pipelines = new Map<string, PipelineAggregate<any>>();
    private readonly registry = PipelineStepRegistry.getInstance();

    public Create<TContext extends PipelineContextData>(name: string): PipelineAggregate<TContext> {
        if (this.pipelines.has(name)) {
            return this.pipelines.get(name) as PipelineAggregate<TContext>;
        }

        const pipeline = new PipelineAggregate<TContext>({ Name: name });

        // Автоматически регистрируем все шаги из глобального реестра
        for (const step of this.registry.GetSteps(name)) {
            pipeline.Register(step as any);
        }

        this.pipelines.set(name, pipeline);
        return pipeline;
    }

    public Get<TContext extends PipelineContextData>(
        name: string,
    ): PipelineAggregate<TContext> | undefined {
        return this.pipelines.get(name) as PipelineAggregate<TContext> | undefined;
    }

    public GetOrCreate<TContext extends PipelineContextData>(
        name: string,
    ): PipelineAggregate<TContext> {
        return this.Get<TContext>(name) ?? this.Create<TContext>(name);
    }

    public Has(name: string): boolean {
        return this.pipelines.has(name);
    }

    public Remove(name: string): void {
        const pipeline = this.pipelines.get(name);
        if (pipeline) {
            pipeline.Destroy();
            this.pipelines.delete(name);
        }
    }

    public Clear(): void {
        for (const [, pipeline] of this.pipelines) {
            pipeline.Destroy();
        }
        this.pipelines.clear();
    }

    public GetAll(): ReadonlyMap<string, PipelineAggregate<any>> {
        return this.pipelines;
    }
}
