// ─────────────────────────────────────────────
//  ReplicatedAtom / Aggregates / ReplicatedAtomAggregate.ts
// ─────────────────────────────────────────────

import { atom } from "@rbxts/charm";
import type { Atom } from "@rbxts/charm";

import { AtomPathAccessorComponent } from "../Components/AtomPathAccessorComponent";
import { DeepCloneComponent } from "../Components/AtomPathAccessorComponent";

import type { IReplicatedAtom, ReplicatorName } from "../Types/ReplicatedAtomTypes";
import type {
    AtomPath,
    AtomPathValue,
} from "shared/Domain/ReplicatedAtoms_OLD/Types/AtomPathTypes";

export class ReplicatedAtomAggregate<TState extends object> implements IReplicatedAtom {
    public readonly Name: ReplicatorName;

    private readonly stateAtom: Atom<TState>;
    private readonly accessor = new AtomPathAccessorComponent();
    private readonly clone = new DeepCloneComponent();

    constructor(name: ReplicatorName, defaultState: TState) {
        this.Name = name;
        this.stateAtom = atom<TState>(this.clone.Deep(defaultState));
    }

    public GetAtom(): Atom<any> {
        return this.stateAtom;
    }

    public GetState(): TState {
        return this.stateAtom();
    }

    public SetState(state: TState): void {
        this.stateAtom(this.clone.Deep(state));
    }

    public Get<TPath extends AtomPath<TState>>(
        path: TPath,
    ): AtomPathValue<TState, TPath> | undefined {
        return this.accessor.Get<AtomPathValue<TState, TPath>>(this.stateAtom(), path);
    }

    public Set<TPath extends AtomPath<TState>>(
        path: TPath,
        value: AtomPathValue<TState, TPath>,
    ): void {
        this.stateAtom((s) => this.accessor.Set(s, path, value));
    }

    public Update<TPath extends AtomPath<TState>>(
        path: TPath,
        updater: (
            current: AtomPathValue<TState, TPath> | undefined,
        ) => AtomPathValue<TState, TPath>,
    ): void {
        this.stateAtom((s) => {
            const current = this.accessor.Get<AtomPathValue<TState, TPath>>(s, path);
            return this.accessor.Set(s, path, updater(current));
        });
    }

    public Mutate(updater: (state: TState) => TState): void {
        this.stateAtom(updater);
    }

    public Remove<TPath extends AtomPath<TState>>(path: TPath): void {
        this.stateAtom((s) => this.accessor.Remove(s, path));
    }
}
