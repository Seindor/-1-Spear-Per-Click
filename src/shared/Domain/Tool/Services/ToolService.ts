import { ToolAggregate } from "../Aggregates/ToolAggregate";
import { ToolProperites } from "../Types/ToolTypes";

export class ToolService {
    public tools = new Map<string, ToolAggregate>();

    public NewTool(toolProperties: ToolProperites, toolIndex: number): ToolAggregate {
        if (this.tools.has(`${toolProperties.name}_${toolIndex}`)) {
            warn(
                `Tool with name ${toolProperties.name}_${toolIndex} already exists. Returning existing tool.`,
            );
            return this.tools.get(`${toolProperties.name}_${toolIndex}`)!;
        }

        const tool = new Instance("Tool");
        tool.Name = toolProperties.name;
        tool.CanBeDropped = toolProperties.canBeDropped ?? true;
        tool.ManualActivationOnly = toolProperties.manualActivationOnly ?? false;
        tool.RequiresHandle = toolProperties.requireHandle ?? true;
        tool.ToolTip = toolProperties.toolTip ?? "";
        tool.TextureId = toolProperties.textureId ?? "";

        const toolAggregate = new ToolAggregate(
            toolProperties.name,
            toolIndex,
            tool,
            toolProperties.toolType || "Switch",
        );
        this.tools.set(toolProperties.name, toolAggregate);
        return toolAggregate;
    }

    public GetTool(name: string, index: number): ToolAggregate | undefined {
        return this.tools.get(`${name}_${index}`);
    }

    public DestroyTool(name: string, index: number): void {
        const toolAggregate = this.tools.get(`${name}_${index}`);
        if (toolAggregate) {
            toolAggregate.OnDestroy();
            this.tools.delete(`${name}_${index}`);
        }
    }
}
