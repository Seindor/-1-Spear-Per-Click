import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import type { Container } from "shared/DI/Container";
import { SolverAPI } from "shared/Domain/NumbersSolver/API/SolverAPI";

export function register(container: Container) {
    container.bindSingleton(SharedRegistry.Singletons.API.SolverAPI, () => new SolverAPI());
}
