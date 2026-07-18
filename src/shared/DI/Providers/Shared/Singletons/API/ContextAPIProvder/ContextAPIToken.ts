import { createToken } from "shared/DI/Token.ts";
import { ContextAPI } from "shared/Domain/InputContext/API/ContextAPI";

export const token = createToken<ContextAPI>("ContextAPI");
