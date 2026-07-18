import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import type { Container } from "shared/DI/Container";
import CameraAPI from "shared/Domain/CameraTEST/API/CameraTESTAPI";

export function register(container: Container) {
    container.bindSingleton(SharedRegistry.Singletons.API.CameraTESTAPI, () => new CameraAPI());
}
