import { createToken } from "shared/DI/Token.ts";
import { PassiveAPI } from "shared/Domain/Passive/API/PassiveAPI";

export const token = createToken<PassiveAPI>("PassiveAPI");
