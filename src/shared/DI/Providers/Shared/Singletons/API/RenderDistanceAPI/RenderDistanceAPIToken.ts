import { createToken } from "shared/DI/Token.ts";
import { RenderDistanceAPI } from "shared/Domain/RenderDistance/API/RenderDistanceAPI";

export const token = createToken<RenderDistanceAPI>("RenderDistanceAPI");
