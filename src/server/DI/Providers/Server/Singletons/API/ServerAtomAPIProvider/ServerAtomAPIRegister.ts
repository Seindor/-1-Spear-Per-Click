import { ServerRegistry } from "server/DI/Generated/ServerRegistry";
import type { Container } from "shared/DI/Container";
import { ServerReplicatedAtomAPI } from "shared/Domain/ReplicatedAtoms/API/ServerReplicatedAtomAPI";

export function register(container: Container) {
    container.bindSingleton(
        ServerRegistry.Singletons.API.ServerAtomAPI,
        () => new ServerReplicatedAtomAPI(),
    );
}
