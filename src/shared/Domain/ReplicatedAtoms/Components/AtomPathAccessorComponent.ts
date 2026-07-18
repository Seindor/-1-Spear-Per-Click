// ─────────────────────────────────────────────
//  ReplicatedAtom / Components / AtomPathAccessorComponent.ts
//  (идентично твоему существующему пакету)
// ─────────────────────────────────────────────

type TableKey = string | number;
type UnknownTable = Record<TableKey, unknown>;

export class AtomPathAccessorComponent {
    private readonly parser = new AtomPathParserComponent();
    private readonly clone = new DeepCloneComponent();

    public Get<T = unknown>(state: object, path: string): T | undefined {
        const keys = this.parser.Parse(path);
        let current = state as unknown;
        for (const key of keys) {
            if (!typeIs(current, "table")) return undefined;
            current = (current as UnknownTable)[key];
        }
        return current as T | undefined;
    }

    public Set<TState extends object>(state: TState, path: string, value: unknown): TState {
        const keys = this.parser.Parse(path);
        const root = this.clone.Shallow(state) as UnknownTable;
        let current = root;
        for (let i = 0; i < keys.size() - 1; i++) {
            const key = keys[i];
            const child = current[key];
            current[key] = typeIs(child, "table") ? this.clone.Shallow(child) : {};
            current = current[key] as UnknownTable;
        }
        current[keys[keys.size() - 1]] = value;
        return root as TState;
    }

    public Update<TState extends object>(
        state: TState,
        path: string,
        updater: (current: unknown) => unknown,
    ): TState {
        return this.Set(state, path, updater(this.Get(state, path)));
    }

    public Remove<TState extends object>(state: TState, path: string): TState {
        return this.Set(state, path, undefined);
    }
}

// ─────────────────────────────────────────────
//  ReplicatedAtom / Components / AtomPathParserComponent.ts
// ─────────────────────────────────────────────

export class AtomPathParserComponent {
    public Parse(path: string): string[] {
        const parts = path.split("/").filter((p) => p.size() > 0);
        if (parts.size() === 0) error(`Atom path "${path}" is empty`);
        return parts;
    }

    public Join(base: string, path?: string): string {
        return path && path.size() > 0 ? `${base}/${path}` : base;
    }
}

// ─────────────────────────────────────────────
//  ReplicatedAtom / Components / DeepCloneComponent.ts
// ─────────────────────────────────────────────

type TableKey2 = string | number;
type UnknownTable2 = Record<TableKey2, unknown>;

export class DeepCloneComponent {
    public Shallow<T>(value: T): T {
        if (!typeIs(value, "table")) return value;
        const result = {} as UnknownTable2;
        for (const [k, v] of pairs(value as UnknownTable2)) result[k as TableKey2] = v;
        return result as T;
    }

    public Deep<T>(value: T): T {
        if (!typeIs(value, "table")) return value;
        const result = {} as UnknownTable2;
        for (const [k, v] of pairs(value as UnknownTable2)) result[k as TableKey2] = this.Deep(v);
        return result as T;
    }
}
