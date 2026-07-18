import type { Atom } from "@rbxts/charm";

export type AtomName = string;

export interface IAtomAggregate {
    GetName(): AtomName;
    GetAtom(): Atom<any>;
    GetState(): unknown;
    SetState(state: unknown): void;
}
