import { ServerRegistry } from "server/DI/Generated/ServerRegistry";
import type { Container } from "shared/DI/Container";
import { StatusEffectsAPI } from "shared/Domain/StatusEffects/API/StatusEffectsAPI";

export function register(container: Container) {
    container.bindSingleton(
        ServerRegistry.Singletons.API.StatusEffectsAPI,
        () => new StatusEffectsAPI(),
    );
}
