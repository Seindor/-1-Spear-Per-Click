import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import type { Container } from "shared/DI/Container";
import { ProximityAPI } from "shared/Domain/CustomProximity/API/CustomProximityAPI";

export function register(container: Container) {
    container.bindSingleton(SharedRegistry.Singletons.API.ProximityAPI, () => new ProximityAPI());
}
