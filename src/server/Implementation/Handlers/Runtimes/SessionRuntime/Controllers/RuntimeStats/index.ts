import { RuntimeControllerMap } from "shared/Domain/Runtime/Types/RuntimeTypes";
import { CreateControllerToken } from "shared/Domain/Runtime/Components/ControllerToken";

import { StrengthController } from "./StrengthController";
import { WinsController } from "./WinsController";

export const StrengthControllerToken =
    CreateControllerToken<StrengthController>(`StrengthController`);

export const WinsControllerToken = CreateControllerToken<WinsController>(`WinsController`);

export interface RuntimeStatsControllers extends RuntimeControllerMap {
    StrengthController: StrengthController;
    WinsController: WinsController;
}
