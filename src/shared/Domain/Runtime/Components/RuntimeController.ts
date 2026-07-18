// Runtime / Components / RuntimeController.ts

import type { RuntimeAggregate } from "../Aggregates/RuntimeAggregate";
import type { RuntimeContextData } from "../Types/RuntimeTypes";

/**
 * Базовый класс любого контроллера.
 *
 * Создаётся Lazy при первом runtime.Get(Token).
 * Автоматически получает ссылку на RuntimeAggregate.
 */
export abstract class RuntimeController<TContext extends RuntimeContextData> {
    public abstract readonly Name: string;

    protected runtime!: RuntimeAggregate<TContext>;

    /** @internal — вызывается RuntimeAggregate, не вызывать вручную */
    public _attach(runtime: RuntimeAggregate<TContext>): void {
        this.runtime = runtime;
        this.OnInit();
    }

    /** @internal */
    public _destroy(): void {
        this.OnDestroy();
    }

    /** Вызывается один раз после создания и attach */
    protected OnInit(): void {}

    /** Вызывается при уничтожении Runtime */
    protected OnDestroy(): void {}
}
