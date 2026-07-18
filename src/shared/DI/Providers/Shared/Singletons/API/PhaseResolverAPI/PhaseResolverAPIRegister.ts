import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import type { Container } from "shared/DI/Container";
import { PhaseResolverAPI } from "shared/Domain/PhaseResolver/API/PhaseResolverAPI";

export function register(container: Container) {
    container.bindSingleton(
        SharedRegistry.Singletons.API.PhaseResolverAPI,
        () => new PhaseResolverAPI(),
    );
}
