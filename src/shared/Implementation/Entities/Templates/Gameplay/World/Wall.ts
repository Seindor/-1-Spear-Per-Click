import Fusion, { Children } from "@rbxts/fusion";

export type IWall = {
    ["Break_Texture"]: Texture;
    ["Break_Texture"]: Texture;
    ["Break_Texture"]: Texture;
    ["Break_Texture"]: Texture;
    ["Break_Texture"]: Texture;
    ["Break_Texture"]: Texture;
    ["Counter"]: {
        ["Gui"]: {
            ["Title"]: {
                ["UIStroke"]: UIStroke;
            } & TextLabel;
        } & SurfaceGui;
    } & Part;
    ["Counter_Weld"]: Weld;
    ["Gui"]: {
        ["Healthbar"]: {
            ["Bar"]: {
                ["UICorner"]: UICorner;
                ["UIGradient"]: UIGradient;
                ["UIStroke"]: UIStroke;
            } & Frame;
            ["Counter"]: {
                ["UIStroke"]: UIStroke;
            } & TextLabel;
            ["UICorner"]: UICorner;
            ["UIGradient"]: UIGradient;
            ["UIStroke"]: UIStroke;
        } & Frame;
    } & SurfaceGui;
    ["Tile_Texture"]: Texture;
    ["Tile_Texture"]: Texture;
    ["Tile_Texture"]: Texture;
    ["Tile_Texture"]: Texture;
    ["Tile_Texture"]: Texture;
} & Part;

export function Create_Wall(): IWall {
    const data = Fusion.New("Part")({
        Name: "Wall",
        Anchored: true,
        BottomSurface: Enum.SurfaceType.Smooth,
        CFrame: new CFrame(88.233, 10.5, -40, 1, 0, 0, 0, 1, 0, 0, 0, 1),
        CastShadow: false,
        Color: new Color3(1, 1, 1),
        Massless: true,
        Material: Enum.Material.SmoothPlastic,
        Size: new Vector3(36.79341506958008, 18.999982833862305, 2),
        TopSurface: Enum.SurfaceType.Smooth,

        [Children]: [
            Fusion.New("SurfaceGui")({
                Name: "Gui",
                Brightness: 1.5,
                CanvasSize: new Vector2(400, 350),
                ClipsDescendants: true,
                Face: Enum.NormalId.Back,
                MaxDistance: 1000,
                PixelsPerStud: 75,
                SizingMode: Enum.SurfaceGuiSizingMode.PixelsPerStud,
                ZIndexBehavior: Enum.ZIndexBehavior.Sibling,

                [Children]: [
                    Fusion.New("Frame")({
                        Name: "Healthbar",
                        AnchorPoint: new Vector2(0.5, 0.5),
                        BackgroundColor3: new Color3(1, 1, 1),
                        Position: new UDim2(0.5, 0, 0.8, 0),
                        Size: new UDim2(0.7, 0, 0.1, 0),

                        [Children]: [
                            Fusion.New("UICorner")({
                                Name: "UICorner",
                                CornerRadius: new UDim(1, 0),
                            }),

                            Fusion.New("UIGradient")({
                                Name: "UIGradient",
                                Color: new ColorSequence([
                                    new ColorSequenceKeypoint(0, Color3.fromRGB(67, 67, 67)),
                                    new ColorSequenceKeypoint(1, Color3.fromRGB(31, 31, 31)),
                                ]),
                                Rotation: 90,
                            }),

                            Fusion.New("UIStroke")({
                                Name: "UIStroke",
                                Thickness: 2,
                            }),

                            Fusion.New("Frame")({
                                Name: "Bar",
                                BackgroundColor3: new Color3(1, 1, 1),
                                Size: new UDim2(1, 0, 1, 0),
                                ZIndex: 2,

                                [Children]: [
                                    Fusion.New("UICorner")({
                                        Name: "UICorner",

                                        CornerRadius: new UDim(1, 0),
                                    }),

                                    Fusion.New("UIGradient")({
                                        Name: "UIGradient",
                                        Color: new ColorSequence([
                                            new ColorSequenceKeypoint(
                                                0,
                                                Color3.fromRGB(153, 255, 0),
                                            ),
                                            new ColorSequenceKeypoint(
                                                1,
                                                Color3.fromRGB(34, 255, 0),
                                            ),
                                        ]),
                                        Rotation: 90,
                                    }),

                                    Fusion.New("UIStroke")({
                                        Name: "UIStroke",
                                        Thickness: 10,
                                    }),
                                ],
                            }),

                            Fusion.New("TextLabel")({
                                Name: "Counter",
                                AnchorPoint: new Vector2(0.5, 0.5),
                                BackgroundTransparency: 1,
                                FontFace: new Font("rbxasset://fonts/families/JosefinSans.json"),
                                Position: new UDim2(0.5, 0, 0.55, 0),
                                Size: new UDim2(1, 0, 1, 0),
                                Text: "100 / 100",
                                TextColor3: new Color3(1, 1, 1),
                                TextScaled: true,
                                ZIndex: 3,

                                [Children]: [
                                    Fusion.New("UIStroke")({
                                        Name: "UIStroke",
                                        Thickness: 10,
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
            }),

            Fusion.New("Weld")({
                Name: "Counter_Weld",
                C0: new CFrame(0, 0, 0.967213, -1, 0, 0, 0, 1, 0, 0, 0, -1),
            }),

            Fusion.New("Texture")({
                Name: "Break_Texture",
                Color3: Color3.fromRGB(53, 53, 53),
                ColorMap: "rbxassetid://8515237534",
                Face: Enum.NormalId.Back,
                StudsPerTileU: 12,
                StudsPerTileV: 12,
                Texture: "rbxassetid://8515237534",
                Transparency: 1,
            }),

            Fusion.New("Texture")({
                Name: "Tile_Texture",
                Color3: new Color3(),
                ColorMap: "rbxassetid://6372755229",
                Face: Enum.NormalId.Top,
                StudsPerTileU: 8,
                StudsPerTileV: 8,
                Texture: "rbxassetid://6372755229",
                Transparency: 0.75,
            }),

            Fusion.New("Texture")({
                Name: "Tile_Texture",
                Color3: new Color3(),
                ColorMap: "rbxassetid://6372755229",
                Face: Enum.NormalId.Right,
                StudsPerTileU: 8,
                StudsPerTileV: 8,
                Texture: "rbxassetid://6372755229",
                Transparency: 0.75,
            }),

            Fusion.New("Texture")({
                Name: "Tile_Texture",
                Color3: new Color3(),
                ColorMap: "rbxassetid://6372755229",
                Face: Enum.NormalId.Left,
                StudsPerTileU: 8,
                StudsPerTileV: 8,
                Texture: "rbxassetid://6372755229",
                Transparency: 0.75,
            }),

            Fusion.New("Texture")({
                Name: "Tile_Texture",
                Color3: new Color3(),
                ColorMap: "rbxassetid://6372755229",
                StudsPerTileU: 8,
                StudsPerTileV: 8,
                Texture: "rbxassetid://6372755229",
                Transparency: 0.75,
            }),

            Fusion.New("Texture")({
                Name: "Tile_Texture",
                Color3: new Color3(),
                ColorMap: "rbxassetid://6372755229",
                Face: Enum.NormalId.Back,
                StudsPerTileU: 8,
                StudsPerTileV: 8,
                Texture: "rbxassetid://6372755229",
                Transparency: 0.75,
            }),

            Fusion.New("Texture")({
                Name: "Break_Texture",
                Color3: Color3.fromRGB(53, 53, 53),
                ColorMap: "rbxassetid://8515237534",
                Face: Enum.NormalId.Bottom,
                StudsPerTileU: 12,
                StudsPerTileV: 12,
                Texture: "rbxassetid://8515237534",
                Transparency: 1,
            }),

            Fusion.New("Texture")({
                Name: "Break_Texture",
                Color3: Color3.fromRGB(53, 53, 53),
                ColorMap: "rbxassetid://8515237534",
                StudsPerTileU: 12,
                StudsPerTileV: 12,
                Texture: "rbxassetid://8515237534",
                Transparency: 1,
            }),

            Fusion.New("Texture")({
                Name: "Break_Texture",
                Color3: Color3.fromRGB(53, 53, 53),
                ColorMap: "rbxassetid://8515237534",
                Face: Enum.NormalId.Left,
                StudsPerTileU: 12,
                StudsPerTileV: 12,
                Texture: "rbxassetid://8515237534",
                Transparency: 1,
            }),

            Fusion.New("Texture")({
                Name: "Break_Texture",
                Color3: Color3.fromRGB(53, 53, 53),
                ColorMap: "rbxassetid://8515237534",
                Face: Enum.NormalId.Right,
                StudsPerTileU: 12,
                StudsPerTileV: 12,
                Texture: "rbxassetid://8515237534",
                Transparency: 1,
            }),

            Fusion.New("Texture")({
                Name: "Break_Texture",
                Color3: Color3.fromRGB(53, 53, 53),
                ColorMap: "rbxassetid://8515237534",
                Face: Enum.NormalId.Top,
                StudsPerTileU: 12,
                StudsPerTileV: 12,
                Texture: "rbxassetid://8515237534",
                Transparency: 1,
            }),

            Fusion.New("Part")({
                Name: "Counter",
                AudioCanCollide: false,
                CFrame: new CFrame(88.233, 10.5, -39.0328, -1, 0, 0, 0, 1, 0, 0, 0, -1),
                CanCollide: false,
                CanQuery: false,
                CanTouch: false,
                Massless: true,
                Size: new Vector3(13.44019889831543, 5.899999618530273, 0.06555549055337906),
                Transparency: 1,

                [Children]: [
                    Fusion.New("SurfaceGui")({
                        Name: "Gui",
                        CanvasSize: new Vector2(200, 100),

                        [Children]: [
                            Fusion.New("TextLabel")({
                                Name: "Title",
                                BackgroundTransparency: 1,
                                FontFace: new Font(
                                    "rbxasset://fonts/families/JosefinSans.json",
                                    Enum.FontWeight.Bold,
                                    Enum.FontStyle.Normal,
                                ),
                                Size: new UDim2(1, 0, 1, 0),
                                Text: "149",
                                TextColor3: new Color3(1, 1, 1),
                                TextScaled: true,
                                TextStrokeTransparency: 0,

                                [Children]: [
                                    Fusion.New("UIStroke")({
                                        Name: "UIStroke",
                                        Thickness: 5,
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
            }),
        ],
    }) as IWall;

    return data;
}
