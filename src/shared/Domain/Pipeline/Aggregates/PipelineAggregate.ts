// ─────────────────────────────────────────────
//  Pipeline / Aggregates / PipelineAggregate.ts
// ─────────────────────────────────────────────

import { PipelineContext } from "./PipelineContext";
import { PipelineSorter } from "../Components/PipelineSorter";
import { PipelineValidator } from "../Components/PipelineValidator";
import { PipelineExecutor } from "../Components/PipelineExecutor";

import type {
    IPipelineStep,
    PipelineContextData,
    PipelineProperties,
} from "../Types/PipelineTypes";

/**
 * Хранит шаги и запускает их.
 *
 * Run() можно вызывать МНОГО РАЗ — каждый вызов создаёт свой PipelineContext,
 * привязанный к TContext.id (например, tostring(player.UserId)).
 * Этот контекст сохраняется во внутренней Map и доступен позже через
 * GetContext(id) — так можно получить пайплайн-состояние конкретной сущности,
 * а не глобальное состояние всего PipelineAggregate.
 *
 * Сортировка пересчитывается только когда изменяется состав шагов (dirty-флаг).
 */

export class PipelineAggregate<TContext extends PipelineContextData> {
    public readonly Name: string;

    private readonly sorter = new PipelineSorter();
    private readonly validator = new PipelineValidator();
    private readonly executor = new PipelineExecutor();

    private readonly steps: IPipelineStep<TContext>[] = [];
    private sorted: IPipelineStep<TContext>[] = [];
    private dirty = true;

    /** Контекст последнего запуска для каждой сущности, ключ — TContext.id */
    private readonly contexts = new Map<string, PipelineContext<TContext>>();

    // ── lifecycle hooks (опционально) ────────────────────────────────────────
    public BeforeRun?: (ctx: PipelineContext<TContext>) => void;
    public AfterRun?: (ctx: PipelineContext<TContext>) => void;
    public OnError?: (err: unknown, ctx: PipelineContext<TContext>) => void;

    constructor(properties: PipelineProperties) {
        this.Name = properties.Name;
    }

    // ── регистрация шагов ────────────────────────────────────────────────────

    public Register(step: IPipelineStep<TContext>): this {
        if (this.steps.some((s) => s.Id === step.Id)) {
            error(`[Pipeline "${this.Name}"] Step "${step.Id}" already registered`);
        }
        this.steps.push(step);
        this.dirty = true;
        return this;
    }

    public Remove(id: string): this {
        const idx = this.steps.findIndex((s) => s.Id === id);
        if (idx !== -1) {
            this.steps.remove(idx);
            this.dirty = true;
        }
        return this;
    }

    public Has(id: string): boolean {
        return this.steps.some((s) => s.Id === id);
    }

    /** Получить ШАГ по его Id (не путать с GetContext — тот работает по id сущности) */
    public Get(id: string): IPipelineStep<TContext> | undefined {
        return this.steps.find((s) => s.Id === id);
    }

    public GetSteps(): IPipelineStep<TContext>[] {
        return [...this.steps];
    }

    public StepCount(): number {
        return this.steps.size();
    }

    // ── контексты конкретных сущностей ──────────────────────────────────────

    /**
     * Возвращает PipelineContext последнего запуска для конкретной сущности
     * (например, tostring(player.UserId)).
     *
     * @example
     * ```ts
     * const ctx = pipeline.GetContext(tostring(player.UserId));
     * const dataHandler = ctx?.Get<DataHandler>("DataHandler");
     * if (ctx?.IsFinished()) { ... }
     * ```
     */
    public GetContext(id: string): PipelineContext<TContext> | undefined {
        return this.contexts.get(id);
    }

    public HasContext(id: string): boolean {
        return this.contexts.has(id);
    }

    /** Удаляет сохранённый контекст сущности (например, при выходе игрока) */
    public RemoveContext(id: string): boolean {
        return this.contexts.delete(id);
    }

    public GetAllContexts(): ReadonlyMap<string, PipelineContext<TContext>> {
        return this.contexts;
    }

    public ClearContexts(): void {
        this.contexts.clear();
    }

    // ── запуск ───────────────────────────────────────────────────────────────

    /**
     * Запускает все шаги для переданных данных.
     * Возвращает PipelineContext — можно читать результаты сразу же,
     * а также позже получить его через GetContext(data.id).
     */
    public Run(data: TContext, log?: boolean): PipelineContext<TContext> {
        const ctx = new PipelineContext<TContext>(data);

        if (this.dirty) {
            this.validator.Validate(this.steps);
            this.sorted = this.sorter.Sort(this.steps);
            this.dirty = false;
        }

        try {
            if (log === true) {
                ctx.Log(`Pipeline "${this.Name}" started (${this.sorted.size()} steps)`);
            }

            this.BeforeRun?.(ctx);
            this.executor.Execute(ctx, this.sorted);
            this.AfterRun?.(ctx);

            ctx._markFinished();

            if (log === true) {
                ctx.Log(`Pipeline "${this.Name}" finished`);
            }
        } catch (err) {
            this.OnError?.(err, ctx);
            error(`[Pipeline "${this.Name}"] failed: ${err}`);
        }

        ctx._markExecuted();
        ctx._lock();

        this.contexts.set(data.id, ctx);

        return ctx;
    }

    public Destroy(): void {
        this.steps.clear();
        this.sorted = [];
        this.dirty = true;
        this.contexts.clear();
    }
}
