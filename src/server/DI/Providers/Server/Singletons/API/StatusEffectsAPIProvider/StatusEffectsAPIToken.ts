import { createToken } from "shared/DI/Token.ts";
import type { Container } from "shared/DI/Container";
import { StatusEffectsAPI } from "shared/Domain/StatusEffects/API/StatusEffectsAPI";

export const token = createToken<StatusEffectsAPI>("StatusEffectsAPI");
