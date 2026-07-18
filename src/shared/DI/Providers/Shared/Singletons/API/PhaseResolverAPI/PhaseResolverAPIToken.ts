import { createToken } from "shared/DI/Token.ts";
import { PhaseResolverAPI } from "shared/Domain/PhaseResolver/API/PhaseResolverAPI";

export const token = createToken<PhaseResolverAPI>("PhaseResolverAPI");
