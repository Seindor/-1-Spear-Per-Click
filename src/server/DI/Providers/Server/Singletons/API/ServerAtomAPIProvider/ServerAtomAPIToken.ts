import { createToken } from "shared/DI/Token.ts";
import { ServerReplicatedAtomAPI } from "shared/Domain/ReplicatedAtoms/API/ServerReplicatedAtomAPI";

export const token = createToken<ServerReplicatedAtomAPI>("ServerReplicatedAtomAPI");
