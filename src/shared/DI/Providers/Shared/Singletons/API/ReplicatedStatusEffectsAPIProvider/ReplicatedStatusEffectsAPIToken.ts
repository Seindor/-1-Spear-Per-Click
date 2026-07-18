import { createToken } from "shared/DI/Token.ts";
import { ReplicatedStatusEffectsAPI } from "shared/Domain/StatusEffects/API/ReplicatedStatusEffectsAPI";

export const token = createToken<ReplicatedStatusEffectsAPI>("ReplicatedStatusEffectsAPI");
