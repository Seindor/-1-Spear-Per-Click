import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import type { Container } from "shared/DI/Container";
import { AnimationsAPI } from "shared/Domain/AnimationsController/API/AnimationsAPI";

export function register(container: Container) {
    container.bindSingleton(SharedRegistry.Singletons.API.AnimationsAPI, () => new AnimationsAPI());
}
