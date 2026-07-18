import { createToken } from "shared/DI/Token.ts";
import { ClientReplicatedAtomAPI } from "shared/Domain/ReplicatedAtoms/API/ClientReplicatedAtomAPI";

export const token = createToken<ClientReplicatedAtomAPI>("ClientReplicatedAtomAPI");
