import { createToken } from "shared/DI/Token.ts";
import CameraAPI from "shared/Domain/CameraTEST/API/CameraTESTAPI";

export const token = createToken<CameraAPI>("CameraTESTAPI");
