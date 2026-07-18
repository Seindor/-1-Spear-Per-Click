import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import type { Container } from "shared/DI/Container";
import { AbilityAPI } from "shared/Domain/Ability/API/AbilityAPI";

export function register(container: Container) {
    container.bindSingleton(SharedRegistry.Singletons.API.AbilityAPI, () => new AbilityAPI());
}
