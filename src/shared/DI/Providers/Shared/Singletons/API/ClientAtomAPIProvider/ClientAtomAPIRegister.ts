import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import type { Container } from "shared/DI/Container";
import { ClientReplicatedAtomAPI } from "shared/Domain/ReplicatedAtoms/API/ClientReplicatedAtomAPI";

export function register(container: Container) {
    container.bindSingleton(
        SharedRegistry.Singletons.API.ClientAtomAPI,
        () => new ClientReplicatedAtomAPI(),
    );
}
