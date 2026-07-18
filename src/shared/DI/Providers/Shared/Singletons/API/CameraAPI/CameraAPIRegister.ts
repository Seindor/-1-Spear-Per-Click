import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import type { Container } from "shared/DI/Container";
import { CameraAPI } from "shared/Domain/Camera/API/CameraAPI";

export function register(container: Container) {
    container.bindSingleton(SharedRegistry.Singletons.API.CameraAPI, () => new CameraAPI());
}
