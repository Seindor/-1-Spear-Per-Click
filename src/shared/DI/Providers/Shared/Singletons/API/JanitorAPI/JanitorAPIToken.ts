import { createToken } from "shared/DI/Token.ts";
import { JanitorAPI } from "shared/Domain/Janitor/API/JanitorAPI";

export const token = createToken<JanitorAPI>("JanitorAPI");
