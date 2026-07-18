// ─────────────────────────────────────────────
//  ReplicatedAtom / Types / ReplicatedAtomTypes.ts
// ─────────────────────────────────────────────

import type { Atom } from "@rbxts/charm";

export type ReplicatorName = string;

export interface IReplicatedAtom {
    readonly Name: ReplicatorName;
    GetAtom(): Atom<unknown>;
}

// Что летит через RemoteEvent
export interface SyncPayload {
    readonly channel: ReplicatorName;
    readonly data: unknown;
}
