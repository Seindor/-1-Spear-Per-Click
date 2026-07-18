import { CreateControllerToken } from "shared/Domain/Runtime/Components/ControllerToken";
import type { ServersController } from "./Controllers/ServersController";

export const ServersControllerToken = CreateControllerToken<ServersController>("ServersController");
