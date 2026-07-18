// Runtime / Components / ControllerToken.ts

import type { ControllerToken } from "../Types/RuntimeTypes";
import type { RuntimeController } from "./RuntimeController";

export function CreateControllerToken<TController extends RuntimeController<any>>(
    name: string,
): ControllerToken<TController> {
    return { Name: name };
}
