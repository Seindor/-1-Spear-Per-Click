import { CreatePipelineToken } from "shared/Domain/Pipeline/Decorators/Pipeline";
import type { PipelineContextData } from "shared/Domain/Pipeline/Types/PipelineTypes";

export interface PlayerContext extends PipelineContextData {
    readonly id: string;
    readonly player: Player;
}

export const PlayerPipelineToken = CreatePipelineToken<PlayerContext>("Player");
