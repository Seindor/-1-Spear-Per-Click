type TableKey = string | number;
type UnknownTable = Record<TableKey, unknown>;

export class DeepCloneComponent {
    public Shallow<T>(value: T): T {
        if (!typeIs(value, "table")) {
            return value;
        }

        const result = {} as UnknownTable;

        for (const [key, child] of pairs(value as UnknownTable)) {
            result[key as TableKey] = child;
        }

        return result as T;
    }

    public Deep<T>(value: T): T {
        if (!typeIs(value, "table")) {
            return value;
        }

        const result = {} as UnknownTable;

        for (const [key, child] of pairs(value as UnknownTable)) {
            result[key as TableKey] = this.Deep(child);
        }

        return result as T;
    }
}
