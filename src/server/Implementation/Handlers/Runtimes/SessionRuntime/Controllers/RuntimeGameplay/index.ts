import { RuntimeControllerMap } from "shared/Domain/Runtime/Types/RuntimeTypes";
import { CreateControllerToken } from "shared/Domain/Runtime/Components/ControllerToken";

import { WorldsController } from "./WorldsController";

export const WorldsControllerToken = CreateControllerToken<WorldsController>(`WorldsController`);

export interface RuntimeGamePlayControllers extends RuntimeControllerMap {
    WorldsController: WorldsController;
}
