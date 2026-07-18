import type { Container } from "shared/DI/Container";
import { DataStoreAPI } from "server/Domain/DataStore/API/DataStoreAPI";
import { ServerRegistry } from "server/DI/Generated/ServerRegistry";

export function register(container: Container) {
    container.bindSingleton(ServerRegistry.Singletons.API.DataStoreAPI, (scope) =>
        scope.create(DataStoreAPI),
    );
}
