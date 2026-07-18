import { HighlightAggregate } from "../../Aggregates/HighlightAggregate";

export = (name?: string) => {
    return new HighlightAggregate({
        Name: name ?? `PurpleHighlight_${math.random(1, 99999)}`,
        DepthMode: Enum.HighlightDepthMode.Occluded,
        FillColor: Color3.fromRGB(142, 5, 255),
        FillTransparency: 0.85,
        OutlineColor: Color3.fromRGB(142, 5, 255),
        OutlineTransparency: 0,
    });
};
