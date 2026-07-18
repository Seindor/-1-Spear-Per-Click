// Runtime / Aggregates / ControllerAggregate.ts

import type { RuntimeController } from "../Components/RuntimeController";
import type {
    ControllerToken,
    RuntimeContextData,
    RuntimeControllerMap,
} from "../Types/RuntimeTypes";

/**
 * Кэш созданных контроллеров для одного Runtime.
 * Не содержит логики создания.
 */
export class ControllerAggregate<
    TContext extends RuntimeContextData,
    TMap extends RuntimeControllerMap = RuntimeControllerMap,
> {
    private readonly cache = new Map<string, RuntimeController<TContext>>();

    public Has(token: ControllerToken<any>): boolean {
        return this.cache.has(token.Name);
    }

    public Get<TController extends RuntimeController<TContext>>(
        token: ControllerToken<TController>,
    ): TController | undefined {
        return this.cache.get(token.Name) as TController | undefined;
    }

    public Set<TController extends RuntimeController<TContext>>(
        token: ControllerToken<TController>,
        controller: TController,
    ): void {
        this.cache.set(token.Name, controller);
    }

    public DestroyAll(): void {
        for (const [, controller] of this.cache) {
            controller._destroy();
        }
        this.cache.clear();
    }

    public GetAll(): ReadonlyMap<string, RuntimeController<TContext>> {
        return this.cache;
    }
}
