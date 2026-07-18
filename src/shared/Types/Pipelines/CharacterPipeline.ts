import { CreatePipelineToken } from "shared/Domain/Pipeline/Decorators/Pipeline";
import type { PipelineContextData } from "shared/Domain/Pipeline/Types/PipelineTypes";

export interface ClientCharacterContext extends PipelineContextData {
    readonly id: string;
    readonly character: Model;
    readonly type: `Player` | `NPC`;
}

export const ClientCharacterPipelineToken =
    CreatePipelineToken<ClientCharacterContext>("ClientCharacter");
