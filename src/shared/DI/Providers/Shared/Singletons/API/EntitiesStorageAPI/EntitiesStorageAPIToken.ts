import { createToken } from "shared/DI/Token.ts";
import { EntitiesStorageAPI } from "shared/Domain/EntitiesStorage/API/EntitiesStorageAPI";

export const token = createToken<EntitiesStorageAPI>("EntitiesStorageAPI");
