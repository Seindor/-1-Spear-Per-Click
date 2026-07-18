import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import type { Container } from "shared/DI/Container";
import { RuntimeAPI } from "shared/Domain/Runtime/API/RuntimeAPI";

export function register(container: Container) {
    container.bindSingleton(SharedRegistry.Singletons.API.RuntimeAPI, () => new RuntimeAPI());
}
