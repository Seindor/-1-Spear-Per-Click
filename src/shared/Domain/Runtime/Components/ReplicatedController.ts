// Runtime / Components / ReplicatedController.ts

import { RuntimeController } from "./RuntimeController";
import type { RuntimeContextData } from "../Types/RuntimeTypes";

/**
 * Расширение RuntimeController с поддержкой репликации.
 *
 * Контроллер НИЧЕГО не знает про RemoteEvent / Atom / Replica.
 * Он только вызывает this.Sync() — остальное делает RuntimeReplicator.
 *
 * @example
 * ```ts
 * export class HealthController extends ReplicatedController<PlayerContext> {
 *     public readonly Name = "Health";
 *     private hp = 100;
 *
 *     public Damage(value: number) {
 *         this.hp -= value;
 *         this.Sync();
 *     }
 *
 *     protected Serialize() {
 *         return { Hp: this.hp };
 *     }
 * }
 * ```
 */
export abstract class ReplicatedController<
    TContext extends RuntimeContextData,
> extends RuntimeController<TContext> {
    /**
     * Реплицировать текущее состояние.
     * Вызывай после каждого изменения состояния.
     */
    protected Sync(): void {
        this.runtime.Replicate({
            Controller: this.Name,
            Payload: this.Serialize(),
        });
    }

    /**
     * Вернуть всё состояние, которое должно уйти клиенту.
     */
    protected abstract Serialize(): unknown;
}
