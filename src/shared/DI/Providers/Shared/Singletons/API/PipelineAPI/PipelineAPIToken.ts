import { createToken } from "shared/DI/Token.ts";
import { PipelineAPI } from "shared/Domain/Pipeline/API/PipelineAPI";

export const token = createToken<PipelineAPI>("PipelineAPI");
