import { Janitor } from "@rbxts/janitor";
import { HighlightProperties } from "../Types/HighlightTypes";

export class HighlightAggregate {
    public _janitor = new Janitor<any>();
    public instance: Highlight;

    constructor(properties: HighlightProperties) {
        this.instance = new Instance("Highlight");
        this.instance.Name = properties.Name ?? "Highlight";
        this.instance.Adornee = properties.Adornee;
        this.instance.DepthMode = properties.DepthMode ?? Enum.HighlightDepthMode.AlwaysOnTop;
        this.instance.FillColor = properties.FillColor ?? Color3.fromRGB(255, 0, 0);
        this.instance.FillTransparency = properties.FillTransparency ?? 0.5;
        this.instance.OutlineColor = properties.OutlineColor ?? Color3.fromRGB(255, 255, 255);
        this.instance.OutlineTransparency = properties.OutlineTransparency ?? 0;
        this.instance.Parent = properties.Parent;

        this._janitor.Add(this.instance, "Destroy", "DestroyInstance");
    }

    public Destroy() {
        this.instance.Destroy();
        this._janitor.Cleanup();
    }
}
