import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import type { Container } from "shared/DI/Container";
import { TraceClipAPI } from "shared/Domain/TraceClip/API/TraceClipAPI";

export function register(container: Container) {
    container.bindSingleton(SharedRegistry.Singletons.API.TraceClipAPI, () => new TraceClipAPI());
}
