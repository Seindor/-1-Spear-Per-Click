import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import type { Container } from "shared/DI/Container";
import { ClickDetectorAPI } from "shared/Domain/ClickDetector/API/ClickDetectorAPI";

export function register(container: Container) {
    container.bindSingleton(
        SharedRegistry.Singletons.API.ClickDetectorAPI,
        () => new ClickDetectorAPI(),
    );
}
