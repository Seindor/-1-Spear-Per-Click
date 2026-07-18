import { createToken } from "shared/DI/Token.ts";
import { AbilityAPI } from "shared/Domain/Ability/API/AbilityAPI";

export const token = createToken<AbilityAPI>("AbilityAPI");
