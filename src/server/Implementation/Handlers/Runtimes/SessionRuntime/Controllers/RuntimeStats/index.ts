import { RuntimeControllerMap } from "shared/Domain/Runtime/Types/RuntimeTypes";
import { CreateControllerToken } from "shared/Domain/Runtime/Components/ControllerToken";

import { HealthController } from "./HealthController";

export const HealthControllerToken = CreateControllerToken<HealthController>("HealthController");

export interface RuntimeStatsControllers extends RuntimeControllerMap {
    HealthController: HealthController;
}
