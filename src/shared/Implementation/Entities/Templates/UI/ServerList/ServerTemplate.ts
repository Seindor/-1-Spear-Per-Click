import Fusion, { Children } from "@rbxts/fusion";

export type IServerTemplate = {
    ["PlayersCount"]: {
        ["UIGradient"]: UIGradient;
        ["UIStroke"]: UIStroke;
    } & TextLabel;
    ["RegionName"]: {
        ["UIStroke"]: UIStroke;
    } & TextLabel;
    ["ServerName"]: {
        ["UIStroke"]: UIStroke;
    } & TextLabel;
    ["ServerTime"]: {
        ["UIGradient"]: UIGradient;
        ["UIStroke"]: UIStroke;
    } & TextLabel;
    ["UICorner"]: UICorner;
    ["UIGradient"]: UIGradient;
    ["UIScale"]: UIScale;
    ["UIStroke"]: UIStroke;
    ["UIStroke1"]: UIStroke;
    ["UIStroke2"]: UIStroke;
} & TextButton;

export function CreateServerTemplate(): IServerTemplate {
    const ServerTemplate = Fusion.New("TextButton")({
        Name: "Server",
        AnchorPoint: new Vector2(0.5, 0.5),
        BackgroundColor3: new Color3(1, 1, 1),
        Position: new UDim2(0.5, 0, 0.122743, 0),
        Selectable: false,
        Size: new UDim2(0.949738, 0, 0.0768766, 0),
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

            Fusion.New("TextLabel")({
                Name: "ServerName",
                AnchorPoint: new Vector2(0.5, 0.5),
                BackgroundTransparency: 1,
                FontFace: new Font(
                    "rbxasset://fonts/families/Guru.json",
                    Enum.FontWeight.Bold,
                    Enum.FontStyle.Normal,
                ),
                Position: new UDim2(0.183, 0, 0.325, 0),
                Size: new UDim2(0.218351, 0, 0.415385, 0),
                Text: "Golden Lord",
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

            Fusion.New("TextLabel")({
                Name: "PlayersCount",
                AnchorPoint: new Vector2(0.5, 0.5),
                BackgroundTransparency: 1,
                FontFace: new Font(
                    "rbxasset://fonts/families/Guru.json",
                    Enum.FontWeight.Bold,
                    Enum.FontStyle.Normal,
                ),
                Position: new UDim2(0.144553, 0, 0.672177, 0),
                Size: new UDim2(0.132404, 0, 0.338462, 0),
                Text: "15 Players",
                TextColor3: new Color3(1, 1, 1),
                TextScaled: true,
                TextXAlignment: Enum.TextXAlignment.Left,

                [Children]: [
                    Fusion.New("UIStroke")({
                        Name: "UIStroke",
                        Thickness: 1.25,
                    }),

                    Fusion.New("UIGradient")({
                        Name: "UIGradient",
                        Color: new ColorSequence([
                            new ColorSequenceKeypoint(0, Color3.fromRGB(255, 121, 26)),
                            new ColorSequenceKeypoint(1, Color3.fromRGB(255, 121, 26)),
                        ]),
                    }),
                ],
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
                Position: new UDim2(0.457, 0, 0.325, 0),
                Size: new UDim2(0.218351, 0, 0.415385, 0),
                Text: "Hesse, DE",
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

            Fusion.New("TextLabel")({
                Name: "ServerTime",
                AnchorPoint: new Vector2(0.5, 0.5),
                BackgroundTransparency: 1,
                FontFace: new Font(
                    "rbxasset://fonts/families/Guru.json",
                    Enum.FontWeight.Bold,
                    Enum.FontStyle.Normal,
                ),
                Position: new UDim2(0.457134, 0, 0.695767, 0),
                Size: new UDim2(0.218351, 0, 0.338462, 0),
                Text: "0h 0m 0s",
                TextColor3: new Color3(1, 1, 1),
                TextScaled: true,
                TextXAlignment: Enum.TextXAlignment.Left,

                [Children]: [
                    Fusion.New("UIStroke")({
                        Name: "UIStroke",
                        Thickness: 1.25,
                    }),

                    Fusion.New("UIGradient")({
                        Name: "UIGradient",
                        Color: new ColorSequence([
                            new ColorSequenceKeypoint(0, Color3.fromRGB(170, 170, 170)),
                            new ColorSequenceKeypoint(1, Color3.fromRGB(170, 170, 170)),
                        ]),
                    }),
                ],
            }),

            Fusion.New("UICorner")({
                Name: "UICorner",
                CornerRadius: new UDim(),
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
    }) as IServerTemplate;

    return ServerTemplate;
}
