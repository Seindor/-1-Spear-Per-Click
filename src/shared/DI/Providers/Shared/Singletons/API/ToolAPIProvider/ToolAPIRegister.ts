import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import type { Container } from "shared/DI/Container";
import { ToolApi } from "shared/Domain/Tool/API/ToolApi";

export function register(container: Container) {
    container.bindSingleton(SharedRegistry.Singletons.API.ToolAPI, () => new ToolApi());
}
