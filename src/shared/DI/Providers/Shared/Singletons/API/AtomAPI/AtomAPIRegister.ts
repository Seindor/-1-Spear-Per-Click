import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import type { Container } from "shared/DI/Container";
import { AtomAPI } from "shared/Domain/ReplicatedAtoms_OLD/API/AtomAPI";

export function register(container: Container) {
    container.bindSingleton(SharedRegistry.Singletons.API.AtomAPI, () => new AtomAPI());
}
