import { RuntimeControllerMap } from "shared/Domain/Runtime/Types/RuntimeTypes";
import { ServersController } from "./Controllers/ServersController";

export interface ServersControllers extends RuntimeControllerMap {
    ServersController: ServersController;
}
