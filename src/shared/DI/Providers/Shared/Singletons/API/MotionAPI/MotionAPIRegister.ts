import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import type { Container } from "shared/DI/Container";
import { MotionAPI } from "shared/Domain/Motion/API/MotionAPI";

export function register(container: Container) {
    container.bindSingleton(SharedRegistry.Singletons.API.MotionAPI, () => new MotionAPI());
}
