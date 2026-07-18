import type { Container } from "./Container";

export function registerDependencies(container: Container, folder: Folder) {
    for (const mod of folder.GetDescendants()) {
        if (!mod.IsA("ModuleScript")) continue;

        if (string.sub(mod.Name, -8) !== "Register") continue;

        const module = require(mod) as { register?: (c: Container) => void };

        if (module.register && typeOf(module.register) === "function") {
            module.register(container);
        }
    }
}
