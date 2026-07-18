import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import type { Container } from "shared/DI/Container";
import { ContextAPI } from "shared/Domain/InputContext/API/ContextAPI";

export function register(container: Container) {
    container.bindSingleton(SharedRegistry.Singletons.API.ContextAPI, () => new ContextAPI());
}
