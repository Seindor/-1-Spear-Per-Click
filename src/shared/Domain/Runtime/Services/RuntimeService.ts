// Runtime / Services / RuntimeService.ts

import { RuntimeAggregate } from "../Aggregates/RuntimeAggregate";

import type { RuntimeController } from "../Components/RuntimeController";
import type {
    ControllerToken,
    RuntimeContextData,
    RuntimeControllerConstructor,
    RuntimeControllerMap,
    RuntimeReplicator,
} from "../Types/RuntimeTypes";

/**
 * Хранит все активные Runtime и реестр контроллеров.
 *
 * Поддерживает именованные Runtime-типы ("Session", "Combat", "NPC").
 * Для каждого имени — свой реестр контроллеров.
 */
export class RuntimeService<TContext extends RuntimeContextData> {
    // runtimeName → { registry, runtimes }
    private readonly buckets = new Map<
        string,
        {
            registry: Map<string, RuntimeControllerConstructor<TContext>>;
            runtimes: Map<string, RuntimeAggregate<TContext, any>>;
            replicator?: RuntimeReplicator;
        }
    >();

    // ── bucket helpers ───────────────────────────────────────────────────────

    private GetOrCreateBucket(runtimeName: string) {
        let bucket = this.buckets.get(runtimeName);

        if (!bucket) {
            bucket = {
                registry: new Map(),
                runtimes: new Map(),
            };
            this.buckets.set(runtimeName, bucket);
        }

        return bucket;
    }

    private RequireBucket(runtimeName: string) {
        const bucket = this.buckets.get(runtimeName);
        if (!bucket) error(`[RuntimeService] Unknown runtime type "${runtimeName}"`);
        return bucket;
    }

    // ── регистрация ──────────────────────────────────────────────────────────

    public Register<TController extends RuntimeController<TContext>>(
        runtimeName: string,
        token: ControllerToken<TController>,
        ctor: RuntimeControllerConstructor<TContext, TController>,
    ): void {
        const bucket = this.GetOrCreateBucket(runtimeName);

        if (bucket.registry.has(token.Name)) {
            warn(
                `[RuntimeService] "${runtimeName}/${token.Name}" already registered — overwriting`,
            );
        }

        bucket.registry.set(token.Name, ctor);
    }

    public SetReplicator(runtimeName: string, replicator: RuntimeReplicator): void {
        this.GetOrCreateBucket(runtimeName).replicator = replicator;
    }

    // ── runtime lifecycle ────────────────────────────────────────────────────

    public Create<TMap extends RuntimeControllerMap>(
        context: TContext,
        runtimeName: string,
    ): RuntimeAggregate<TContext, TMap> {
        const bucket = this.GetOrCreateBucket(runtimeName);
        const { id } = context;

        if (bucket.runtimes.has(id)) {
            return bucket.runtimes.get(id)!;
        }

        const runtime = new RuntimeAggregate<TContext, TMap>(
            context,
            bucket.registry,
            bucket.replicator,
        );

        bucket.runtimes.set(id, runtime);
        return runtime;
    }

    public Get<TMap extends RuntimeControllerMap>(
        id: string,
        runtimeName: string,
    ): RuntimeAggregate<TContext, TMap> | undefined {
        return this.buckets.get(runtimeName)?.runtimes.get(id) as
            | RuntimeAggregate<TContext, TMap>
            | undefined;
    }

    public GetOrThrow<TMap extends RuntimeControllerMap>(
        id: string,
        runtimeName: string,
    ): RuntimeAggregate<TContext, TMap> {
        const runtime = this.Get<TMap>(id, runtimeName);
        if (!runtime) {
            error(`[RuntimeService] Runtime "${runtimeName}:${id}" does not exist`);
        }
        return runtime;
    }

    public Has(id: string, runtimeName: string): boolean {
        return this.buckets.get(runtimeName)?.runtimes.has(id) ?? false;
    }

    public Remove(id: string, runtimeName: string): void {
        const bucket = this.buckets.get(runtimeName);
        if (!bucket) return;

        const runtime = bucket.runtimes.get(id);
        if (!runtime) return;

        runtime.Destroy();
        bucket.runtimes.delete(id);
    }

    public ClearType(runtimeName: string): void {
        const bucket = this.buckets.get(runtimeName);
        if (!bucket) return;

        for (const [, runtime] of bucket.runtimes) {
            runtime.Destroy();
        }
        bucket.runtimes.clear();
    }

    public Clear(): void {
        for (const [, bucket] of this.buckets) {
            for (const [, runtime] of bucket.runtimes) {
                runtime.Destroy();
            }
        }
        this.buckets.clear();
    }

    public GetAll(runtimeName: string): ReadonlyMap<string, RuntimeAggregate<TContext, any>> {
        return this.buckets.get(runtimeName)?.runtimes ?? new Map();
    }
}
