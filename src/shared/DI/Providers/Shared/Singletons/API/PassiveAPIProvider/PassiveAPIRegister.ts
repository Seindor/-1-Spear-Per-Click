import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import type { Container } from "shared/DI/Container";
import { PassiveAPI } from "shared/Domain/Passive/API/PassiveAPI";

export function register(container: Container) {
    container.bindSingleton(SharedRegistry.Singletons.API.PassiveAPI, () => new PassiveAPI());
}
