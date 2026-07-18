// ─────────────────────────────────────────────
//  ReplicatedAtom / Components / ReplicatedAtomRegistry.ts
// ─────────────────────────────────────────────

import type { IReplicatedAtom } from "../Types/ReplicatedAtomTypes";

/**
 * Глобальный реестр репликаторов.
 * Декоратор @RegisterReplicator пишет сюда.
 * ReplicatedAtomService читает отсюда при старте.
 */
export class ReplicatedAtomRegistry {
    private static readonly instance = new ReplicatedAtomRegistry();
    public static getInstance(): ReplicatedAtomRegistry {
        return ReplicatedAtomRegistry.instance;
    }

    private readonly map = new Map<string, IReplicatedAtom>();
    private constructor() {}

    public Register(replicator: IReplicatedAtom): void {
        if (this.map.has(replicator.Name)) {
            warn(`[ReplicatedAtomRegistry] "${replicator.Name}" already registered — skipping`);
            return;
        }
        this.map.set(replicator.Name, replicator);
    }

    public Get(name: string): IReplicatedAtom | undefined {
        return this.map.get(name);
    }

    public GetAll(): ReadonlyMap<string, IReplicatedAtom> {
        return this.map;
    }
}
