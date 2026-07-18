// ─────────────────────────────────────────────
//  ReplicatedAtom / Decorators / RegisterReplicator.ts
// ─────────────────────────────────────────────

import { ReplicatedAtomRegistry } from "../Components/ReplicatedAtomRegistry";
import type { IReplicatedAtom } from "../Types/ReplicatedAtomTypes";

const registry = ReplicatedAtomRegistry.getInstance();

export function RegisterReplicator() {
    return function <T extends new () => IReplicatedAtom>(ctor: T): T {
        registry.Register(new ctor());
        return ctor;
    };
}
