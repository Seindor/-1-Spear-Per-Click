import { createToken } from "shared/DI/Token.ts";
import { ProximityAPI } from "shared/Domain/CustomProximity/API/CustomProximityAPI";

export const token = createToken<ProximityAPI>("ProximityAPI");
