import { createToken } from "shared/DI/Token.ts";
import { MotionAPI } from "shared/Domain/Motion/API/MotionAPI";

export const token = createToken<MotionAPI>("MotionAPI");
