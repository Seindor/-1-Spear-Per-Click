// Runtime / API / RuntimeAPI.ts

import { RuntimeService } from "../Services/RuntimeService";
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
 * Публичный фасад Runtime-системы.
 *
 * @example
 * ```ts
 * // 1. Регистрация контроллеров для типа Runtime
 * runtimeAPI
 *     .Register("Session", HealthToken,    HealthController)
 *     .Register("Session", PostureToken,   PostureController)
 *     .Register("Session", InventoryToken, InventoryController);
 *
 * // 2. Создание — TMap даёт типизацию
 * const session = runtimeAPI.Create<SessionControllers>(
 *     { id: tostring(player.UserId), player },
 *     "Session",
 * );
 *
 * // 3. Использование (lazy — создаётся при первом Get)
 * session.Get(HealthToken).Damage(25);
 *
 * // 4. Получить позже из другого места
 * const session = runtimeAPI.Get<SessionControllers>(id, "Session");
 * session?.Get(PostureToken).AddPosture(10);
 * ```
 */
export class RuntimeAPI<TContext extends RuntimeContextData> {
    private readonly service: RuntimeService<TContext>;

    constructor(service?: RuntimeService<TContext>) {
        this.service = service ?? new RuntimeService<TContext>();
    }

    // ── setup ────────────────────────────────────────────────────────────────

    /**
     * Зарегистрировать контроллер для конкретного типа Runtime.
     * Вызывается один раз при старте, до первого Create().
     */
    public Register<TController extends RuntimeController<TContext>>(
        runtimeName: string,
        token: ControllerToken<TController>,
        ctor: RuntimeControllerConstructor<TContext, TController>,
    ): this {
        this.service.Register(runtimeName, token, ctor);
        return this;
    }

    /**
     * Подключить репликатор для конкретного типа Runtime.
     */
    public SetReplicator(runtimeName: string, replicator: RuntimeReplicator): this {
        this.service.SetReplicator(runtimeName, replicator);
        return this;
    }

    // ── runtime lifecycle ────────────────────────────────────────────────────

    /**
     * Создать новый Runtime.
     *
     * TMap — карта контроллеров, даёт типизацию Get().
     *
     * @example
     * ```ts
     * const session = runtimeAPI.Create<SessionControllers>(
     *     { id: tostring(player.UserId), player },
     *     "Session",
     * );
     * ```
     */
    public Create<TMap extends RuntimeControllerMap = RuntimeControllerMap>(
        context: TContext,
        runtimeName: string,
    ): RuntimeAggregate<TContext, TMap> {
        return this.service.Create<TMap>(context, runtimeName);
    }

    /**
     * Получить существующий Runtime или undefined.
     */
    public Get<TMap extends RuntimeControllerMap = RuntimeControllerMap>(
        id: string,
        runtimeName: string,
    ): RuntimeAggregate<TContext, TMap> | undefined {
        return this.service.Get<TMap>(id, runtimeName);
    }

    /**
     * Получить существующий Runtime или бросить ошибку.
     */
    public GetOrThrow<TMap extends RuntimeControllerMap = RuntimeControllerMap>(
        id: string,
        runtimeName: string,
    ): RuntimeAggregate<TContext, TMap> {
        return this.service.GetOrThrow<TMap>(id, runtimeName);
    }

    public Has(id: string, runtimeName: string): boolean {
        return this.service.Has(id, runtimeName);
    }

    public Remove(id: string, runtimeName: string): void {
        this.service.Remove(id, runtimeName);
    }

    public ClearType(runtimeName: string): void {
        this.service.ClearType(runtimeName);
    }

    public Clear(): void {
        this.service.Clear();
    }

    public GetAll(runtimeName: string): ReadonlyMap<string, RuntimeAggregate<TContext, any>> {
        return this.service.GetAll(runtimeName);
    }
}
