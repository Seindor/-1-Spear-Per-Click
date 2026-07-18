import { HighlightAggregate } from "../../Aggregates/HighlightAggregate";

export = (name?: string) => {
    return new HighlightAggregate({
        Name: name ?? `YellowHighlight_${math.random(1, 99999)}`,
        DepthMode: Enum.HighlightDepthMode.Occluded,
        FillColor: Color3.fromRGB(255, 255, 255),
        FillTransparency: 0.5,
        OutlineColor: Color3.fromRGB(255, 255, 255),
        OutlineTransparency: 0,
    });
};
