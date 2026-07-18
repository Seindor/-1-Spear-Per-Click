import { HighlightAggregate } from "../../Aggregates/HighlightAggregate";

export = (name?: string) => {
    return new HighlightAggregate({
        Name: name ?? `YellowHighlight_${math.random(1, 99999)}`,
        DepthMode: Enum.HighlightDepthMode.Occluded,
        FillColor: Color3.fromRGB(255, 195, 14),
        FillTransparency: 0.85,
        OutlineColor: Color3.fromRGB(255, 195, 14),
        OutlineTransparency: 0,
    });
};
