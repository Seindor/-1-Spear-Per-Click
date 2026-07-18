// ─────────────────────────────────────────────
//  Pipeline / Aggregates / PipelineContext.ts
// ─────────────────────────────────────────────

import type { PipelineContextData } from "../Types/PipelineTypes";

/**
 * Контекст одного запуска пайплайна.
 *
 * Хранит:
 *  - Data      — типизированные входные данные (id, player, …)
 *  - values    — runtime-хранилище промежуточных объектов (Set / Get / Require)
 *  - logs      — лог выполнения
 *
 * Каждый вызов PipelineAggregate.Run() создаёт СВОЙ PipelineContext,
 * привязанный к Data.id — именно поэтому Finished/executed теперь
 * живут здесь, а не в самом PipelineAggregate (который общий на все запуски).
 *
 * После завершения всех шагов контекст блокируется — попытка
 * записать в него что-либо бросит ошибку.
 */
export class PipelineContext<TContext extends PipelineContextData> {
    /** Типизированные входные данные */
    public readonly Data: TContext;

    private readonly values = new Map<string, unknown>();
    private readonly logs: string[] = [];

    private _locked = false;
    private _executed = false;
    private _finished = false;

    constructor(data: TContext) {
        this.Data = data;
    }

    // ── runtime storage ──────────────────────────────────────────────────────

    public Set<T>(key: string, value: T): this {
        if (this._locked) error(`[PipelineContext] Locked — cannot Set("${key}")`);
        this.values.set(key, value);
        return this;
    }

    public Get<T>(key: string): T | undefined {
        return this.values.get(key) as T | undefined;
    }

    /** Получить значение или бросить ошибку, если его нет */
    public Require<T>(key: string): T {
        const v = this.values.get(key);
        if (v === undefined) error(`[PipelineContext] Required key "${key}" not found`);
        return v as T;
    }

    public Has(key: string): boolean {
        return this.values.has(key);
    }

    public Delete(key: string): this {
        if (this._locked) error(`[PipelineContext] Locked — cannot Delete("${key}")`);
        this.values.delete(key);
        return this;
    }

    public GetValues(): ReadonlyMap<string, unknown> {
        return this.values;
    }

    // ── logging ──────────────────────────────────────────────────────────────

    public MarkLaunched(stepId: string) {
        print(`[${this.Data.pipelineName}/${stepId}] Launched for ${this.Data.id}`);
    }

    public MarkCompleted(stepId: string) {
        print(`[${this.Data.pipelineName}/${stepId}] Completed for ${this.Data.id}`);
    }

    public MarkLoaded(stepId: string) {
        print(`[${this.Data.pipelineName}/${stepId}] Loaded for ${this.Data.id}`);
    }

    public MarkFailed(stepId: string) {
        print(`[${this.Data.pipelineName}/${stepId}] Failed for ${this.Data.id}`);
    }

    public Log(message: string): void {
        const line = `${message}`;
        this.logs.push(line);
        print(line);
    }

    public Warn(message: string): void {
        const line = `[Pipeline:${this.Data.id}] WARN ${message}`;
        this.logs.push(line);
        warn(line);
    }

    public GetLogs(): readonly string[] {
        return this.logs;
    }

    // ── lifecycle ────────────────────────────────────────────────────────────

    /** @internal вызывается PipelineAggregate после завершения (успех или ошибка) */
    public _markExecuted(): void {
        this._executed = true;
    }

    /** @internal вызывается PipelineAggregate только при УСПЕШНОМ завершении запуска */
    public _markFinished(): void {
        this._finished = true;
    }

    /** @internal блокирует запись после завершения */
    public _lock(): void {
        this._locked = true;
    }

    /** Пайплайн для этой сущности отработал (Execute вызван для всех шагов) */
    public IsExecuted(): boolean {
        return this._executed;
    }

    /** Пайплайн для этой сущности отработал БЕЗ ошибок */
    public IsFinished(): boolean {
        return this._finished;
    }

    public IsLocked(): boolean {
        return this._locked;
    }
}
