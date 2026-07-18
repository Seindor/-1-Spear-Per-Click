// Runtime / Types / RuntimeTypes.ts

import type { RuntimeController } from "../Components/RuntimeController";
import type { RuntimeAggregate } from "../Aggregates/RuntimeAggregate";

export interface RuntimeContextData {
    readonly id: string;
}

/**
 * Карта контроллеров — описывает что входит в конкретный Runtime.
 *
 * @example
 * ```ts
 * interface SessionControllers {
 *     Health:    HealthController;
 *     Posture:   PostureController;
 *     Inventory: InventoryController;
 * }
 * ```
 */
export type RuntimeControllerMap = Record<string, RuntimeController<any>>;

/**
 * Токен контроллера.
 * Несёт имя и тип — даёт полную типизацию при Get().
 */
export interface ControllerToken<
    TController extends RuntimeController<any> = RuntimeController<any>,
> {
    readonly Name: string;
    readonly __type?: TController;
}

/**
 * Извлекает тип контроллера из карты по имени токена.
 * Используется внутри RuntimeAggregate для типизации Get().
 */
export type ControllerFromMap<
    TMap extends RuntimeControllerMap,
    TToken extends ControllerToken<any>,
> =
    TToken extends ControllerToken<infer TController>
        ? TController extends RuntimeController<any>
            ? TController
            : never
        : never;

export interface RuntimeControllerConstructor<
    TContext extends RuntimeContextData,
    TController extends RuntimeController<TContext> = RuntimeController<TContext>,
> {
    new (): TController;
}

export interface RuntimeReplicationPacket {
    readonly Controller: string;
    readonly Payload: unknown;
}

export interface RuntimeReplicator {
    Replicate(runtime: RuntimeAggregate<any, any>, packet: RuntimeReplicationPacket): void;
}
