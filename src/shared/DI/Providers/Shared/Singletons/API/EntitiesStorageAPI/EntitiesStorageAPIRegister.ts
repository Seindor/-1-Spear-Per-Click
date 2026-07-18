import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import type { Container } from "shared/DI/Container";
import { EntitiesStorageAPI } from "shared/Domain/EntitiesStorage/API/EntitiesStorageAPI";

export function register(container: Container) {
    container.bindSingleton(
        SharedRegistry.Singletons.API.EntitiesStorageAPI,
        () => new EntitiesStorageAPI(),
    );
}
