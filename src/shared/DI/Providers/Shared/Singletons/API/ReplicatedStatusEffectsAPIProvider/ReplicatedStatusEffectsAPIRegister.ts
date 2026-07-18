import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import type { Container } from "shared/DI/Container";
import { ReplicatedStatusEffectsAPI } from "shared/Domain/StatusEffects/API/ReplicatedStatusEffectsAPI";

export function register(container: Container) {
    container.bindSingleton(
        SharedRegistry.Singletons.API.ReplicatedStatusEffectsAPI,
        () => new ReplicatedStatusEffectsAPI(),
    );
}
