import type { RuntimeContextData } from "shared/Domain/Runtime/Types/RuntimeTypes";

export interface ServerContext extends RuntimeContextData {
    readonly id: string;
}
