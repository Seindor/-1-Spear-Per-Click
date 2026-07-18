import type { Atom } from "@rbxts/charm";
import { AtomPathAccessorComponent } from "../Components/AtomPathAccessorComponent";
import { AtomPathParserComponent } from "../Components/AtomPathParserComponent";
import type { AtomPath, AtomPathValue } from "../Types/AtomPathTypes";

export class AtomCursorAggregate<TRootState extends object, TCursorState extends object> {
    private readonly accessor = new AtomPathAccessorComponent();
    private readonly parser = new AtomPathParserComponent();

    public constructor(
        private readonly stateAtom: Atom<TRootState>,
        private readonly basePath: string,
    ) {}

    public GetPath(): string {
        return this.basePath;
    }

    public GetRoot(): TCursorState | undefined {
        return this.accessor.Get<TCursorState>(this.stateAtom(), this.basePath);
    }

    public GetAtom(): Atom<TRootState> {
        return this.stateAtom;
    }

    public SetRoot(value: TCursorState) {
        this.stateAtom((state) => {
            return this.accessor.Set(state, this.basePath, value);
        });
    }

    public Get<TPath extends AtomPath<TCursorState>>(
        path: TPath,
    ): AtomPathValue<TCursorState, TPath> | undefined {
        const fullPath = this.parser.Join(this.basePath, path);

        return this.accessor.Get<AtomPathValue<TCursorState, TPath>>(this.stateAtom(), fullPath);
    }

    public Set<TPath extends AtomPath<TCursorState>>(path: TPath, value: unknown) {
        const fullPath = this.parser.Join(this.basePath, path);

        this.stateAtom((state) => {
            return this.accessor.Set(state, fullPath, value);
        });
    }

    public SetStrict<TPath extends AtomPath<TCursorState>>(
        path: TPath,
        value: AtomPathValue<TCursorState, TPath>,
    ) {
        const fullPath = this.parser.Join(this.basePath, path);

        this.stateAtom((state) => {
            return this.accessor.Set(state, fullPath, value);
        });
    }

    public Update<TPath extends AtomPath<TCursorState>>(
        path: TPath,
        updater: (current: unknown) => unknown,
    ) {
        const fullPath = this.parser.Join(this.basePath, path);

        this.stateAtom((state) => {
            return this.accessor.Update(state, fullPath, updater);
        });
    }

    public UpdateStrict<TPath extends AtomPath<TCursorState>>(
        path: TPath,
        updater: (
            current: AtomPathValue<TCursorState, TPath> | undefined,
        ) => AtomPathValue<TCursorState, TPath>,
    ) {
        const fullPath = this.parser.Join(this.basePath, path);

        this.stateAtom((state) => {
            const current = this.accessor.Get<AtomPathValue<TCursorState, TPath>>(state, fullPath);

            return this.accessor.Set(state, fullPath, updater(current));
        });
    }

    public Remove<TPath extends AtomPath<TCursorState>>(path: TPath) {
        const fullPath = this.parser.Join(this.basePath, path);

        this.stateAtom((state) => {
            return this.accessor.Remove(state, fullPath);
        });
    }
}
