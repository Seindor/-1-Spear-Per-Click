import { ToolProperites } from "../Types/ToolTypes";
import { ToolService } from "../Services/ToolService";
import { ToolAggregate } from "../Aggregates/ToolAggregate";

export class ToolApi {
    private service = new ToolService();

    public NewTool(toolProperties: ToolProperites, toolIndex: number): ToolAggregate {
        return this.service.NewTool(toolProperties, toolIndex);
    }

    public GetTool(name: string, index: number): ToolAggregate | undefined {
        return this.service.GetTool(name, index);
    }

    public DestroyTool(name: string, index: number): void {
        this.service.DestroyTool(name, index);
    }
}
