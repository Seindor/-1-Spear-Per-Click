import { AtomPathParserComponent } from "./AtomPathParserComponent";
import { DeepCloneComponent } from "./DeepCloneComponent";

type TableKey = string | number;
type UnknownTable = Record<TableKey, unknown>;

export class AtomPathAccessorComponent {
    private readonly parser = new AtomPathParserComponent();
    private readonly clone = new DeepCloneComponent();

    public Get<T = unknown>(state: object, path: string): T | undefined {
        const keys = this.parser.Parse(path);

        let current = state as unknown;

        for (const key of keys) {
            if (!typeIs(current, "table")) {
                return undefined;
            }

            current = (current as UnknownTable)[key];
        }

        return current as T | undefined;
    }

    public Set<TState extends object>(state: TState, path: string, value: unknown): TState {
        const keys = this.parser.Parse(path);

        const root = this.clone.Shallow(state) as UnknownTable;
        let current = root;

        for (let index = 0; index < keys.size() - 1; index++) {
            const key = keys[index];
            const child = current[key];

            if (typeIs(child, "table")) {
                current[key] = this.clone.Shallow(child);
            } else {
                current[key] = {};
            }

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
        const current = this.Get(state, path);
        const _next = updater(current);

        return this.Set(state, path, _next);
    }

    public Remove<TState extends object>(state: TState, path: string): TState {
        return this.Set(state, path, undefined);
    }
}
