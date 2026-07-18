// ─────────────────────────────────────────────
//  ReplicatedAtom / Services / ServerReplicatedAtomService.ts
// ─────────────────────────────────────────────

import { server } from "@rbxts/charm-sync";
import { ReplicatedAtomRegistry } from "../Components/ReplicatedAtomRegistry";
import type { SyncPayload } from "../Types/ReplicatedAtomTypes";

export type ServerSendCallback = (player: Player, payload: SyncPayload) => void;

/**
 * Список получателей для одного актора в одном канале.
 * actorId → Set<Player>
 */
type RecipientMap = Map<string, Set<Player>>;

export class ServerReplicatedAtomService {
    private readonly registry = ReplicatedAtomRegistry.getInstance();
    public Inited = false as boolean;
    private onSend?: ServerSendCallback;

    private readonly syncers = new Map<string, ReturnType<typeof server>>();

    // channel → actorId → Set<Player>
    private readonly recipients = new Map<string, RecipientMap>();

    public SetSendCallback(cb: ServerSendCallback): void {
        this.onSend = cb;
    }

    // ── recipients ───────────────────────────────────────────────────────────

    /**
     * Добавить получателя данных актора в канале.
     *
     * @example
     * // По умолчанию в LoadDataStep:
     * service.AddRecipient("SessionStats", playerId, player);
     *
     * // При активации абилки "просмотр HP":
     * service.AddRecipient("SessionStats", targetId, observerPlayer);
     */
    public AddRecipient(channel: string, actorId: string, player: Player): void {
        let channelMap = this.recipients.get(channel);
        if (!channelMap) {
            channelMap = new Map();
            this.recipients.set(channel, channelMap);
        }

        let players = channelMap.get(actorId);
        if (!players) {
            players = new Set();
            channelMap.set(actorId, players);
        }

        players.add(player);
    }

    public RemoveRecipient(channel: string, actorId: string, player: Player): void {
        this.recipients.get(channel)?.get(actorId)?.delete(player);
    }

    /**
     * Убрать игрока из всех каналов всех акторов.
     * Вызывать при PlayerRemoving.
     */
    public RemovePlayerFromAll(player: Player): void {
        for (const [, channelMap] of this.recipients) {
            for (const [, players] of channelMap) {
                players.delete(player);
            }
        }
    }

    /**
     * Убрать актора из всех каналов.
     * Вызывать когда NPC/игрок уничтожается.
     */
    public RemoveActorFromAll(actorId: string): void {
        for (const [, channelMap] of this.recipients) {
            channelMap.delete(actorId);
        }
    }

    public GetRecipients(channel: string, actorId: string): ReadonlySet<Player> {
        return this.recipients.get(channel)?.get(actorId) ?? new Set();
    }

    // ── init / hydrate ───────────────────────────────────────────────────────

    public Init(): void {
        if (this.Inited) return;

        this.Inited = true;

        for (const [name, replicator] of this.registry.GetAll()) {
            const syncer = server({
                atoms: { [name]: replicator.GetAtom() },
            });

            this.syncers.set(name, syncer);

            syncer.connect((player, payload) => {
                if (!this.onSend) return;

                const channelMap = this.recipients.get(name);
                if (!channelMap) return;

                // payload is shaped { type: "init" | "patch", data: { [atomName]: atomState } }
                const wirePayload = payload as {
                    type: "init" | "patch";
                    data: Record<string, unknown>;
                };
                const atomState = wirePayload.data[name];

                const filtered = this.filterForPlayer(atomState, player, channelMap);
                if (filtered !== undefined) {
                    this.onSend(player, {
                        channel: name,
                        data: {
                            type: wirePayload.type,
                            data: { [name]: filtered },
                        },
                    });
                }
            });
        }
    }

    /**
     * Гидрация игрока — отправить текущее состояние всех каналов.
     * Вызывать после LoadDataStep (когда получатели уже добавлены).
     */
    public Hydrate(player: Player): void {
        for (const [, syncer] of this.syncers) {
            syncer.hydrate(player);
        }
    }

    public Get<T>(name: string): T | undefined {
        return this.registry.Get(name) as T | undefined;
    }

    // ── private ──────────────────────────────────────────────────────────────

    /**
     * Из всего payload оставляем только данные акторов
     * для которых player стоит в списке получателей.
     *
     * Ключи в атоме имеют вид:
     *   "actorId"         — корневые данные актора
     *   "actorId/Health"  — вложенные данные
     */
    private filterForPlayer(
        data: unknown,
        player: Player,
        channelMap: RecipientMap,
    ): unknown | undefined {
        if (!typeIs(data, "table")) return undefined;

        const result: Record<string, unknown> = {};
        let hasData = false;

        for (const [key, value] of pairs(data as Record<string, unknown>)) {
            if (!typeIs(key, "string")) continue;

            // Извлекаем actorId — всё до первого "/"
            const slashPos = key.find("/")[0];
            const actorId = slashPos !== undefined ? key.sub(1, slashPos - 1) : key;

            // Проверяем: является ли player получателем данных этого актора
            const players = channelMap.get(actorId);

            if (players?.has(player)) {
                result[key] = value;
                hasData = true;
            }
        }

        return hasData ? result : undefined;
    }
}
