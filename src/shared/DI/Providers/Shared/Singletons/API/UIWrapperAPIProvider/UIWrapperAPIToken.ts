import { createToken } from "shared/DI/Token.ts";
import { UIWrapperAPI } from "shared/Domain/UIWrapper/API/UIWrapperAPI";

export const token = createToken<UIWrapperAPI>("UIWrapperAPI");
