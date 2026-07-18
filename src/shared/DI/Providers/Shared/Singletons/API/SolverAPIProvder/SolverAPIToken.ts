import { createToken } from "shared/DI/Token.ts";
import { SolverAPI } from "shared/Domain/NumbersSolver/API/SolverAPI";

export const token = createToken<SolverAPI>("SolverAPI");
