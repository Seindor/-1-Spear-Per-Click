import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import type { Container } from "shared/DI/Container";
import EventBusAPI from "shared/Domain/EventBus/API/EventBusAPI";

export function register(container: Container) {
    container.bindSingleton(SharedRegistry.Singletons.API.EventBusAPI, () => new EventBusAPI());
}
