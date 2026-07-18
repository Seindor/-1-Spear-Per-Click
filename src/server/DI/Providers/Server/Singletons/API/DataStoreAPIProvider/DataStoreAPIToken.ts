import { createToken } from "shared/DI/Token.ts";
import type { Container } from "shared/DI/Container";
import { DataStoreAPI } from "server/Domain/DataStore/API/DataStoreAPI";

export const token = createToken<DataStoreAPI>("DataStoreAPI");
export function register(container: Container) {
    container.bindSingleton(token, (scope) => scope.create(DataStoreAPI));
}
