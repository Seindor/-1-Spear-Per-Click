import { createToken } from "shared/DI/Token.ts";
import type { Container } from "shared/DI/Container";
import { GameEffectsAPI } from "server/Domain/GameEffectsQueue/API/GameEffectsApi";

export const token = createToken<GameEffectsAPI>("GameEffectsAPI");
