import { createToken } from "shared/DI/Token.ts";
import EventBusAPI from "shared/Domain/EventBus/API/EventBusAPI";

export const token = createToken<EventBusAPI>("EventBusAPI");
