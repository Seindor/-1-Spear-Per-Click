import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import type { Container } from "shared/DI/Container";
import { AssetsHelperApi } from "shared/Domain/AssetsHelper/API/AssetsHelperApi";

export function register(container: Container) {
    container.bindSingleton(
        SharedRegistry.Singletons.API.AssetsHelperAPI,
        () => new AssetsHelperApi(),
    );
}
