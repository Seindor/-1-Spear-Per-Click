import { createToken } from "shared/DI/Token.ts";
import { RuntimeAPI } from "shared/Domain/Runtime/API/RuntimeAPI";

export const token = createToken<RuntimeAPI<any>>("RuntimeAPI");
