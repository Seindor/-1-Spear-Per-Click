// ─────────────────────────────────────────────
//  ReplicatedAtom / API / ServerReplicatedAtomAPI.ts
// ─────────────────────────────────────────────

import { ServerReplicatedAtomService } from "../Services/ServerReplicatedAtomService";
import type { ServerSendCallback } from "../Services/ServerReplicatedAtomService";

export class ServerReplicatedAtomAPI {
    private readonly service: ServerReplicatedAtomService;

    constructor(service?: ServerReplicatedAtomService) {
        this.service = service ?? new ServerReplicatedAtomService();
    }

    public SetSendCallback(cb: ServerSendCallback): this {
        this.service.SetSendCallback(cb);
        return this;
    }

    public Init(): this {
        this.service.Init();
        return this;
    }

    public Hydrate(player: Player): void {
        this.service.Hydrate(player);
    }

    public Get<T>(name: string): T | undefined {
        return this.service.Get<T>(name);
    }

    // ── recipients ───────────────────────────────────────────────────────────

    /**
     * Добавить получателя данных актора в канале.
     *
     * @example
     * // В LoadDataStep — игрок видит свои данные:
     * api.AddRecipient("SessionStats", playerId, player);
     * api.AddRecipient("Inventory",    playerId, player);
     *
     * // При активации абилки наблюдения:
     * api.AddRecipient("SessionStats", targetId, observerPlayer);
     *
     * // В пати — все видят HP друг друга:
     * for (const member of partyMembers) {
     *     api.AddRecipient("SessionStats", targetId, member);
     * }
     */
    public AddRecipient(channel: string, actorId: string, player: Player): this {
        this.service.AddRecipient(channel, actorId, player);
        return this;
    }

    public RemoveRecipient(channel: string, actorId: string, player: Player): this {
        this.service.RemoveRecipient(channel, actorId, player);
        return this;
    }

    /**
     * Удалить игрока из всех каналов всех акторов.
     * Вызывать при PlayerRemoving.
     */
    public RemovePlayerFromAll(player: Player): this {
        this.service.RemovePlayerFromAll(player);
        return this;
    }

    /**
     * Удалить актора из всех каналов.
     * Вызывать при уничтожении NPC / выходе игрока.
     */
    public RemoveActorFromAll(actorId: string): this {
        this.service.RemoveActorFromAll(actorId);
        return this;
    }
}
