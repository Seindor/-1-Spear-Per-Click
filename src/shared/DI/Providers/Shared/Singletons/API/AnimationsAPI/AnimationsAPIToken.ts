import { createToken } from "shared/DI/Token.ts";
import { AnimationsAPI } from "shared/Domain/AnimationsController/API/AnimationsAPI";

export const token = createToken<AnimationsAPI>("AnimationsAPI");
