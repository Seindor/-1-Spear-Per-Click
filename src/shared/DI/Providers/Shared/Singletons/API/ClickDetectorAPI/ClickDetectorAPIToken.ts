import { createToken } from "shared/DI/Token.ts";
import { ClickDetectorAPI } from "shared/Domain/ClickDetector/API/ClickDetectorAPI";

export const token = createToken<ClickDetectorAPI>("ClickDetectorAPI");
