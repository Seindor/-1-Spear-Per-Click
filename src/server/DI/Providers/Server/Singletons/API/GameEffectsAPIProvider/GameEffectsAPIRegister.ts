import { ServerRegistry } from "server/DI/Generated/ServerRegistry";
import type { Container } from "shared/DI/Container";
import { GameEffectsAPI } from "server/Domain/GameEffectsQueue/API/GameEffectsApi";

export function register(container: Container) {
    container.bindSingleton(
        ServerRegistry.Singletons.API.GameEffectsAPI,
        () => new GameEffectsAPI(),
    );
}
