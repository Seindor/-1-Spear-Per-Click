export interface ToolProperites {
    name: string;
    canBeDropped?: boolean;
    manualActivationOnly?: boolean;
    requireHandle?: boolean;
    toolTip?: string;
    textureId?: string;
    toolType?: "Switch" | "Holdable";
}
