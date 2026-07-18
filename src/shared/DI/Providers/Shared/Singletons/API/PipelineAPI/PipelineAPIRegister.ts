import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import type { Container } from "shared/DI/Container";
import { PipelineAPI } from "shared/Domain/Pipeline/API/PipelineAPI";

export function register(container: Container) {
    container.bindSingleton(SharedRegistry.Singletons.API.PipelineAPI, () => new PipelineAPI());
}
