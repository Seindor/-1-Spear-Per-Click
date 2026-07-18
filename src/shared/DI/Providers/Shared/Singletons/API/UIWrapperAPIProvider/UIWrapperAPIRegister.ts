import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import type { Container } from "shared/DI/Container";
import { UIWrapperAPI } from "shared/Domain/UIWrapper/API/UIWrapperAPI";

export function register(container: Container) {
    container.bindSingleton(SharedRegistry.Singletons.API.UIWrapperAPI, () => new UIWrapperAPI());
}
