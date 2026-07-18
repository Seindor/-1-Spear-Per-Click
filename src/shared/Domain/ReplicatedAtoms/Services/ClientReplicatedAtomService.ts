// ─────────────────────────────────────────────
//  ReplicatedAtom / Services / ClientReplicatedAtomService.ts
//
//  Клиентская сторона.
//  Принимает SyncPayload, раздаёт по каналам.
//  Lazy — syncer создаётся при первом получении.
// ─────────────────────────────────────────────

import { client } from "@rbxts/charm-sync";
import { SyncPayload } from "../Types/ReplicatedAtomTypes";
import { atom, subscribe } from "@rbxts/charm";
import type { Atom } from "@rbxts/charm";
import { AtomPathAccessorComponent } from "../Components/AtomPathAccessorComponent";

export class ClientReplicatedAtomService {
    private readonly atoms = new Map<string, Atom<unknown>>();
    private readonly syncers = new Map<string, ReturnType<typeof client>>();
    private readonly ready = new Map<string, boolean>();
    private readonly subscriptions = new Map<string, Map<string, () => void>>();
    private readonly accessor = new AtomPathAccessorComponent();

    /**
     * Принять пакет с сервера.
     * Вызывается из RemoteEvent.OnClientEvent.
     */
    public Receive(payload: SyncPayload): void {
        const syncer = this.GetOrCreateSyncer(payload.channel);
        syncer.sync(payload.data as never);

        if (!this.ready.get(payload.channel)) {
            this.ready.set(payload.channel, true);
        }
    }

    /**
     * Ждёт пока канал придёт с сервера.
     * Использовать в Pipeline шагах.
     */
    public WaitForChannel(name: string): void {
        while (!this.ready.get(name)) {
            task.wait(0.05);
        }
    }

    public IsReady(name: string): boolean {
        return this.ready.get(name) === true;
    }

    /**
     * Получить atom конкретного канала.
     * Подписывайся через subscribe() из @rbxts/charm.
     */
    public GetAtom<TState>(name: string): Atom<TState> | undefined {
        return this.atoms.get(name) as Atom<TState> | undefined;
    }

    private GetOrCreateSyncer(name: string) {
        const existing = this.syncers.get(name);
        if (existing) return existing;

        const a = atom<unknown>({});
        this.atoms.set(name, a);

        const syncer = client({ atoms: { [name]: a } });
        this.syncers.set(name, syncer);

        return syncer;
    }

    public Subscribe<TState extends object, TValue>(
        owner: string,
        name: string,
        channel: string,
        path: string,
        callback: (value: TValue | undefined) => void,
    ): void {
        const atom = this.GetAtom<TState>(channel);
        if (!atom) error(`Channel "${channel}" not found`);

        let ownerSubs = this.subscriptions.get(owner);
        if (!ownerSubs) {
            ownerSubs = new Map();
            this.subscriptions.set(owner, ownerSubs);
        }

        // если подписка с таким именем уже есть у этого владельца
        ownerSubs.get(name)?.();
        ownerSubs.delete(name);

        let previous = this.accessor.Get<TValue>(atom(), path);

        callback(previous);

        const disconnect = subscribe(atom, (state) => {
            const current = this.accessor.Get<TValue>(state, path);

            if (current === previous) return;

            previous = current;
            callback(current);
        });

        ownerSubs.set(name, disconnect);
    }

    public Unsubscribe(owner: string, name: string): void {
        const ownerSubs = this.subscriptions.get(owner);
        if (!ownerSubs) return;

        ownerSubs.get(name)?.();
        ownerSubs.delete(name);

        if (ownerSubs.size() === 0) {
            this.subscriptions.delete(owner);
        }
    }

    public UnsubscribeAll(owner: string): void {
        const ownerSubs = this.subscriptions.get(owner);
        if (!ownerSubs) return;

        for (const [, disconnect] of ownerSubs) {
            disconnect();
        }

        this.subscriptions.delete(owner);
    }
}
