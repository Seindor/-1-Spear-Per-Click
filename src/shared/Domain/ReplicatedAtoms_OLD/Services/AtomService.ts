import { AtomAggregate } from "../Aggregates/AtomAggregate";
import type { AtomName, IAtomAggregate } from "../Types/AtomTypes";

export class AtomService {
    private readonly atoms = new Map<AtomName, IAtomAggregate>();

    public NewAtom<TState extends object>(
        name: AtomName,
        defaultState: TState,
    ): AtomAggregate<TState> {
        const existing = this.GetAtom<TState>(name);

        if (existing) {
            return existing;
        }

        const aggregate = new AtomAggregate<TState>(name, defaultState);

        this.atoms.set(name, aggregate as unknown as IAtomAggregate);

        return aggregate;
    }

    public GetAtom<TState extends object>(name: AtomName): AtomAggregate<TState> | undefined {
        return this.atoms.get(name) as unknown as AtomAggregate<TState> | undefined;
    }

    public GetAtomOrThrow<TState extends object>(name: AtomName): AtomAggregate<TState> {
        const atom = this.GetAtom<TState>(name);

        if (!atom) {
            error(`Atom "${name}" does not exist.`);
        }

        return atom;
    }

    public HasAtom(name: AtomName): boolean {
        return this.atoms.has(name);
    }

    public RemoveAtom(name: AtomName) {
        this.atoms.delete(name);
    }

    public GetAllAtoms(): ReadonlyMap<AtomName, IAtomAggregate> {
        return this.atoms;
    }
}
