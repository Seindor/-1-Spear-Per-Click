import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import type { Container } from "shared/DI/Container";
import { JanitorAPI } from "shared/Domain/Janitor/API/JanitorAPI";

export function register(container: Container) {
    container.bindSingleton(SharedRegistry.Singletons.API.JanitorAPI, () => new JanitorAPI());
}
