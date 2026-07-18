import { createToken } from "shared/DI/Token.ts";
import { HitboxAPI } from "shared/Domain/Hitbox/API/HitboxAPI";

export const token = createToken<HitboxAPI>("HitboxAPI");
