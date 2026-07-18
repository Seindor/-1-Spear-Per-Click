import Fusion, { Children } from "@rbxts/fusion";

export type IRegionTemplate = {
    ["RegionName"]: {
        ["UIStroke"]: UIStroke;
    } & TextLabel;
    ["UICorner"]: UICorner;
    ["UIGradient"]: UIGradient;
    ["UIScale"]: UIScale;
    ["UIStroke"]: UIStroke;
    ["UIStroke1"]: UIStroke;
    ["UIStroke2"]: UIStroke;
} & TextButton;

export function CreateRegionTemplate(): IRegionTemplate {
    const RegionTemplate = Fusion.New("TextButton")({
        Name: "Region",
        AnchorPoint: new Vector2(0.5, 0.5),
        BackgroundColor3: new Color3(1, 1, 1),
        Position: new UDim2(0.5, 0, 0.0610611, 0),
        Selectable: false,
        Size: new UDim2(0.949737, 0, 0.158896, 0),
        Text: "",

        [Children]: [
            Fusion.New("UIStroke")({
                Name: "UIStroke",
                ApplyStrokeMode: Enum.ApplyStrokeMode.Border,
                Thickness: 2,
            }),

            Fusion.New("UIScale")({
                Name: "UIScale",
            }),

            Fusion.New("UIStroke")({
                Name: "UIStroke1",
                ApplyStrokeMode: Enum.ApplyStrokeMode.Border,
                BorderStrokePosition: Enum.BorderStrokePosition.Inner,
                Color: Color3.fromRGB(179, 179, 179),
                ZIndex: 2,
            }),

            Fusion.New("UIStroke")({
                Name: "UIStroke2",
                ApplyStrokeMode: Enum.ApplyStrokeMode.Border,
                BorderStrokePosition: Enum.BorderStrokePosition.Inner,
                Thickness: 3,
            }),

            Fusion.New("TextLabel")({
                Name: "RegionName",
                AnchorPoint: new Vector2(0.5, 0.5),
                BackgroundTransparency: 1,
                FontFace: new Font(
                    "rbxasset://fonts/families/Guru.json",
                    Enum.FontWeight.Bold,
                    Enum.FontStyle.Normal,
                ),
                Position: new UDim2(0.529259, 0, 0.479032, 0),
                Size: new UDim2(0.941479, 0, 0.575642, 0),
                Text: "Hesse, DE (999)",
                TextColor3: new Color3(1, 1, 1),
                TextScaled: true,
                TextXAlignment: Enum.TextXAlignment.Left,

                [Children]: [
                    Fusion.New("UIStroke")({
                        Name: "UIStroke",
                        Thickness: 1.25,
                    }),
                ],
            }),

            Fusion.New("UICorner")({
                Name: "UICorner",
                CornerRadius: new UDim(0.05, 0),
            }),

            Fusion.New("UIGradient")({
                Name: "UIGradient",
                Color: new ColorSequence([
                    new ColorSequenceKeypoint(0, Color3.fromRGB(85, 85, 85)),
                    new ColorSequenceKeypoint(1, new Color3()),
                ]),
                Rotation: 90,
                Transparency: new NumberSequence([
                    new NumberSequenceKeypoint(0, 0.5),
                    new NumberSequenceKeypoint(1, 0.5),
                ]),
            }),
        ],
    }) as IRegionTemplate;

    return RegionTemplate;
}
