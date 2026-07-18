import { atom } from "@rbxts/charm";
import type { Atom } from "@rbxts/charm";

import { AtomCursorAggregate } from "./AtomCursorAggregate";
import { AtomPathAccessorComponent } from "../Components/AtomPathAccessorComponent";
import { DeepCloneComponent } from "../Components/DeepCloneComponent";

import type { AtomPath, AtomPathValue, AtomRecordValue } from "../Types/AtomPathTypes";

import type { AtomName, IAtomAggregate } from "../Types/AtomTypes";

export class AtomAggregate<TState extends object> implements IAtomAggregate {
    private readonly stateAtom: Atom<TState>;
    private readonly accessor = new AtomPathAccessorComponent();
    private readonly clone = new DeepCloneComponent();

    public constructor(
        private readonly name: AtomName,
        defaultState: TState,
    ) {
        this.stateAtom = atom<TState>(this.clone.Deep(defaultState));
    }

    public GetName(): AtomName {
        return this.name;
    }

    public GetAtom(): Atom<TState> {
        return this.stateAtom;
    }

    public GetState(): TState {
        return this.stateAtom();
    }

    public SetState(state: TState) {
        this.stateAtom(this.clone.Deep(state));
    }

    public Get<TPath extends AtomPath<TState>>(
        path: TPath,
    ): AtomPathValue<TState, TPath> | undefined {
        return this.accessor.Get<AtomPathValue<TState, TPath>>(this.stateAtom(), path);
    }

    public Set<TPath extends AtomPath<TState>>(path: TPath, value: unknown) {
        this.stateAtom((state) => {
            return this.accessor.Set(state, path, value);
        });
    }

    public SetStrict<TPath extends AtomPath<TState>>(
        path: TPath,
        value: AtomPathValue<TState, TPath>,
    ) {
        this.stateAtom((state) => {
            return this.accessor.Set(state, path, value);
        });
    }

    public Update<TPath extends AtomPath<TState>>(
        path: TPath,
        updater: (current: unknown) => unknown,
    ) {
        this.stateAtom((state) => {
            return this.accessor.Update(state, path, updater);
        });
    }

    public UpdateStrict<TPath extends AtomPath<TState>>(
        path: TPath,
        updater: (
            current: AtomPathValue<TState, TPath> | undefined,
        ) => AtomPathValue<TState, TPath>,
    ) {
        this.stateAtom((state) => {
            const current = this.accessor.Get<AtomPathValue<TState, TPath>>(state, path);

            return this.accessor.Set(state, path, updater(current));
        });
    }

    public Remove<TPath extends AtomPath<TState>>(path: TPath) {
        this.stateAtom((state) => {
            return this.accessor.Remove(state, path);
        });
    }
    public For<TKey extends string | number>(
        key: TKey,
    ): AtomCursorAggregate<TState, AtomRecordValue<TState> & object> {
        return new AtomCursorAggregate<TState, AtomRecordValue<TState> & object>(
            this.stateAtom,
            tostring(key),
        );
    }
}
