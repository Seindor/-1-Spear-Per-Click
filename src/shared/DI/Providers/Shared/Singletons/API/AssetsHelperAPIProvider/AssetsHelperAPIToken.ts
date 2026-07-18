import { createToken } from "shared/DI/Token.ts";
import { AssetsHelperApi } from "shared/Domain/AssetsHelper/API/AssetsHelperApi";

export const token = createToken<AssetsHelperApi>("AssetsHelperApi");
