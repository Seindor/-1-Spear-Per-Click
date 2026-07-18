// Runtime / Aggregates / RuntimeAggregate.ts

import { ControllerAggregate } from "./ControllerAggregate";

import type { RuntimeController } from "../Components/RuntimeController";
import type {
    ControllerToken,
    RuntimeContextData,
    RuntimeControllerConstructor,
    RuntimeControllerMap,
    RuntimeReplicationPacket,
    RuntimeReplicator,
} from "../Types/RuntimeTypes";

/**
 * Агрегат одного Runtime (игрок, NPC, сессия, …).
 *
 * TContext — типизированные данные (id, player, …)
 * TMap     — карта контроллеров, описывает что входит в этот Runtime
 *
 * @example
 * ```ts
 * interface SessionControllers {
 *     Health:  HealthController;
 *     Posture: PostureController;
 * }
 *
 * const runtime = runtimeAPI.Create<SessionControllers>(id, "Session");
 * const health  = runtime.Get(HealthToken);  // → HealthController ✅
 * ```
 */
export class RuntimeAggregate<
    TContext extends RuntimeContextData,
    TMap extends RuntimeControllerMap = RuntimeControllerMap,
> {
    private meta = new Map<string, unknown>();
    public readonly Context: TContext;

    private readonly controllers: ControllerAggregate<TContext, TMap>;

    constructor(
        context: TContext,
        private readonly registry: ReadonlyMap<string, RuntimeControllerConstructor<TContext>>,
        private readonly replicator?: RuntimeReplicator,
    ) {
        this.Context = context;
        this.controllers = new ControllerAggregate<TContext, TMap>();
    }

    // ── lazy get ─────────────────────────────────────────────────────────────

    /**
     * Получить (или создать lazy) контроллер по токену.
     *
     * Тип возвращается из TMap если токен совпадает,
     * иначе из самого ControllerToken<TController>.
     *
     * @example
     * ```ts
     * const health = runtime.Get(HealthToken);   // HealthController
     * health.Damage(10);
     * ```
     */

    public SetMeta<T>(key: string, value: T): this {
        this.meta.set(key, value);
        return this;
    }

    public GetMeta<T>(key: string): T | undefined {
        return this.meta.get(key) as T | undefined;
    }

    public Get<TController extends RuntimeController<TContext>>(
        token: ControllerToken<TController>,
    ): TController {
        const cached = this.controllers.Get(token);
        if (cached !== undefined) return cached;

        const Ctor = this.registry.get(token.Name);

        if (!Ctor) {
            error(`[Runtime "${this.Context.id}"] Controller "${token.Name}" is not registered`);
        }

        const controller = new Ctor() as TController;
        controller._attach(this as RuntimeAggregate<TContext, any>);
        this.controllers.Set(token, controller);

        return controller;
    }

    public Has(token: ControllerToken<any>): boolean {
        return this.controllers.Has(token);
    }

    // ── replication ──────────────────────────────────────────────────────────

    /** @internal вызывается ReplicatedController.Sync() */
    public Replicate(packet: RuntimeReplicationPacket): void {
        if (!this.replicator) return;
        this.replicator.Replicate(this, packet);
    }

    // ── lifecycle ────────────────────────────────────────────────────────────

    public Destroy(): void {
        this.controllers.DestroyAll();
    }
}
