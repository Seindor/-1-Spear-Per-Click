import { AtomService } from "../Services/AtomService";
import type { AtomName } from "../Types/AtomTypes";

export class AtomAPI {
    private readonly atomService = new AtomService();

    public NewAtom<TState extends object>(name: AtomName, defaultState: TState) {
        return this.atomService.NewAtom<TState>(name, defaultState);
    }

    public GetAtom<TState extends object>(name: AtomName) {
        return this.atomService.GetAtom<TState>(name);
    }

    public GetAtomOrThrow<TState extends object>(name: AtomName) {
        return this.atomService.GetAtomOrThrow<TState>(name);
    }

    public HasAtom(name: AtomName): boolean {
        return this.atomService.HasAtom(name);
    }

    public RemoveAtom(name: AtomName) {
        this.atomService.RemoveAtom(name);
    }

    public GetAllAtoms() {
        return this.atomService.GetAllAtoms();
    }
}
