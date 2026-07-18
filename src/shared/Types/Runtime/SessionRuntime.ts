import type { RuntimeContextData } from "shared/Domain/Runtime/Types/RuntimeTypes";

export interface SessionContext extends RuntimeContextData {
    readonly id: string;
}
