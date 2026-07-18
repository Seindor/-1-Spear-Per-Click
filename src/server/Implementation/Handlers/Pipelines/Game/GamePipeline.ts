import { CreatePipelineToken } from "shared/Domain/Pipeline/Decorators/Pipeline";
import { PipelineContextData } from "shared/Domain/Pipeline/Types/PipelineTypes";

export interface GameContext extends PipelineContextData {
    readonly id: `Game`;
}

export const GamePipelineToken = CreatePipelineToken<GameContext>("Game");
