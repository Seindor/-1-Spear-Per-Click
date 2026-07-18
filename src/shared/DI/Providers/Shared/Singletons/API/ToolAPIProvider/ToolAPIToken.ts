import { createToken } from "shared/DI/Token.ts";
import { ToolApi } from "shared/Domain/Tool/API/ToolApi";

export const token = createToken<ToolApi>("ToolApi");
