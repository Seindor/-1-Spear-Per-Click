import { RuntimeControllerMap } from "shared/Domain/Runtime/Types/RuntimeTypes";
import { CreateControllerToken } from "shared/Domain/Runtime/Components/ControllerToken";

import { WeaponController } from "./WeaponController";

export const WeaponControllerToken = CreateControllerToken<WeaponController>("WeaponController");

export interface RuntimeEquipmentControllers extends RuntimeControllerMap {
    WeaponController: WeaponController;
}
