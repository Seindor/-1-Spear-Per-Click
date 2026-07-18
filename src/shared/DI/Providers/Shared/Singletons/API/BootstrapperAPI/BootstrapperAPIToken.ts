import { createToken } from "shared/DI/Token.ts";
import { BootstrapperAPI } from "shared/Domain/Bootstrapper/API/BootstrapperAPI";

export const token = createToken<BootstrapperAPI>("BootstrapperAPI");
