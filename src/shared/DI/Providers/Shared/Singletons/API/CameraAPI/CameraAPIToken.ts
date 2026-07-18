import { createToken } from "shared/DI/Token.ts";
import { CameraAPI } from "shared/Domain/Camera/API/CameraAPI";

export const token = createToken<CameraAPI>("CameraAPI");
