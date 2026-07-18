import type { Container } from "./Container";

type RegistryTree = Record<string, unknown>;

function setPath(root: RegistryTree, path: readonly string[], value: unknown) {
    let currentrent: RegistryTree = root;

    for (let i = 0; i < path.size() - 1; i++) {
        const k = path[i];
        const Next = currentrent[k];

        if (typeOf(Next) !== "table") {
            currentrent[k] = {};
        }

        currentrent = currentrent[k] as RegistryTree;
    }

    currentrent[path[path.size() - 1]] = value;
}

function getPath(root: RegistryTree, path: readonly string[]) {
    let currentrent: unknown = root;
    for (const k of path) {
        if (typeOf(currentrent) !== "table") return undefined;
        currentrent = (currentrent as RegistryTree)[k];
    }
    return currentrent;
}

function normalizeLifetime(seg: string) {
    const s = string.lower(seg);
    if (s === "singletons") return "Singleton";
    if (s === "scoped") return "Scoped";
    if (s === "transients") return "Transient";
    return seg;
}

function keysFromModule(rootFolder: Instance, mod: ModuleScript): string[] {
    const stack: string[] = [];
    let cur: Instance | undefined = mod.Parent;

    while (cur && cur !== rootFolder) {
        stack.push(cur.Name);
        cur = cur.Parent;
    }

    const parts: string[] = [];
    for (let i = stack.size() - 1; i >= 0; i--) {
        if (i === 0) {
            parts.push(normalizeLifetime(stack[i]));
        } else {
            parts.push(stack[i]);
        }
    }

    let leaf = mod.Name;
    if (string.sub(leaf, -8) === "Provider") {
        leaf = string.sub(leaf, 1, leaf.size() - 8);
    }
    parts.push(leaf);

    return parts;
}

export function loadProviders<T extends object>(rootFolder: Instance, container: Container): T {
    const registry: RegistryTree = {};

    for (const instance of rootFolder.GetDescendants()) {
        if (!instance.IsA("ModuleScript")) continue;

        const mod = require(instance) as unknown as {
            register?: (c: Container) => void;
            token?: unknown;
            default?: { register?: (c: Container) => void; token?: unknown };
        };

        const register = mod.register ?? mod.default?.register;
        const token = mod.token ?? mod.default?.token;

        if (typeOf(register) !== "function" || token === undefined) continue;

        register!(container);

        const keys = keysFromModule(rootFolder, instance);
        if (getPath(registry, keys) !== undefined)
            error(`DI: duplicate registry path: ${keys.join(".")}`);
        setPath(registry, keys, token);
    }

    return registry as unknown as T;
}
