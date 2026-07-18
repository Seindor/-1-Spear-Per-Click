export namespace TableHelper {
    export function DeepRemove(tbl: unknown, target: unknown): void {
        if (!typeIs(tbl, "table")) return;

        for (const [k, v] of pairs(tbl)) {
            if (v === target) {
                rawset(tbl, k as never, undefined);
            } else if (typeIs(v, "table")) {
                DeepRemove(v, target);

                if (next(v as object) === undefined) {
                    rawset(tbl, k as never, undefined);
                }
            }
        }
    }
    export function ClearTable(tbl: unknown): void {
        if (!typeIs(tbl, "table")) return;

        for (const [k, v] of pairs(tbl)) {
            if (typeIs(v, "table")) {
                ClearTable(v);
            }
            rawset(tbl, k as never, undefined);
        }
    }
    export function IsEmpty(tbl: unknown): boolean {
        if (!typeIs(tbl, "table")) return true;
        return next(tbl as object) === undefined;
    }

    export function IsTableEmpty(tbl: unknown): boolean {
        for (const [index, object] of pairs(tbl as object)) {
            return false;
        }

        return true;
    }
}
