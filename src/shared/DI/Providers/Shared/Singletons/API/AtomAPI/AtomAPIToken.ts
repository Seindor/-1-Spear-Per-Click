import { createToken } from "shared/DI/Token.ts";
import { AtomAPI } from "shared/Domain/ReplicatedAtoms_OLD/API/AtomAPI";

export const token = createToken<AtomAPI>("AtomAPI");
