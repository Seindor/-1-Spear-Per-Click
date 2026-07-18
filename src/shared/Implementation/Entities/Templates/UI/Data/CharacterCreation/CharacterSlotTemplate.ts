import Fusion, { Children } from "@rbxts/fusion";

export type ICharacterSlotTemplate = {
    ["CurrentSlotFrame"]: {
        ["Class"]: {
            ["UIGradient"]: UIGradient;
            ["UIStroke"]: UIStroke;
        } & TextLabel;
        ["SelectedTitle"]: {
            ["UIStroke"]: UIStroke;
        } & TextLabel;
        ["Side"]: {
            ["CCGGradient"]: UIGradient;
            ["GhoulGradient"]: UIGradient;
        } & Frame;
        ["SlotName"]: {
            ["UIStroke"]: UIStroke;
        } & TextLabel;
        ["UIScale"]: UIScale;
        ["ViewportFrame"]: {
            ["Objects"]: Folder;
        } & ViewportFrame;
    } & Frame;
    ["EmptySlotFrame"]: {
        ["NewSlotGradient"]: UIGradient;
        ["Title_1"]: {
            ["UIStroke"]: UIStroke;
        } & TextLabel;
        ["Title_2"]: {
            ["UIStroke"]: UIStroke;
        } & TextLabel;
        ["UIScale"]: UIScale;
    } & Frame;
    ["NewSlotFrame"]: {
        ["NewSlotGradient"]: UIGradient;
        ["Plus Icon"]: {
            ["UIAspectRatioConstraint"]: UIAspectRatioConstraint;
        } & ImageLabel;
        ["PurchaseSlotTitle"]: {
            ["UIStroke"]: UIStroke;
        } & TextLabel;
        ["UIScale"]: UIScale;
    } & Frame;
    ["UIScale"]: UIScale;
    ["UIStroke1"]: UIStroke;
    ["UIStroke2"]: UIStroke;
} & TextButton;

export function CreateCharacterSlotTemplate(): ICharacterSlotTemplate {
    const characterSlotTemplate = Fusion.New("TextButton")({
        Name: "CharacterSlot",
        AnchorPoint: new Vector2(0.5, 0.5),
        BackgroundColor3: new Color3(),
        BackgroundTransparency: 0.75,
        BorderColor3: new Color3(),
        BorderSizePixel: 0,
        FontFace: new Font("rbxasset://fonts/families/Guru.json"),
        LayoutOrder: 3,
        Position: new UDim2(0.145084, 0, 0.5, 0),
        Selectable: false,
        Size: new UDim2(0.289725, 0, 0.925717, 0),
        Text: "",
        TextColor3: new Color3(1, 1, 1),
        TextScaled: true,

        [Children]: [
            Fusion.New("UIStroke")({
                Name: "UIStroke1",
                ApplyStrokeMode: Enum.ApplyStrokeMode.Border,
                Thickness: 6,
                Transparency: 0.5,
            }),

            Fusion.New("UIStroke")({
                Name: "UIStroke2",
                ApplyStrokeMode: Enum.ApplyStrokeMode.Border,
                Color: new Color3(1, 1, 1),
                Thickness: 1.5,
                Transparency: 0.5,
                ZIndex: 2,
            }),

            Fusion.New("Frame")({
                Name: "NewSlotFrame",
                AnchorPoint: new Vector2(0.5, 0.5),
                BackgroundColor3: new Color3(1, 1, 1),
                BorderColor3: new Color3(),
                BorderSizePixel: 0,
                Position: new UDim2(0.5, 0, 0.5, 0),
                Size: new UDim2(1, 0, 1, 0),
                Visible: false,

                [Children]: [
                    Fusion.New("ImageLabel")({
                        Name: "Plus Icon",
                        AnchorPoint: new Vector2(0.5, 0.5),
                        BackgroundTransparency: 1,
                        Image: "rbxassetid://95953731260370",
                        Position: new UDim2(0.5, 0, 0.5, 0),
                        Size: new UDim2(0.5, 0, 0.5, 0),

                        [Children]: [
                            Fusion.New("UIAspectRatioConstraint")({
                                Name: "UIAspectRatioConstraint",
                            }),
                        ],
                    }),

                    Fusion.New("UIScale")({
                        Name: "UIScale",
                    }),

                    Fusion.New("UIGradient")({
                        Name: "NewSlotGradient",
                        Color: new ColorSequence([
                            new ColorSequenceKeypoint(0, Color3.fromRGB(179, 179, 179)),
                            new ColorSequenceKeypoint(1, new Color3()),
                        ]),
                        Rotation: 90,
                        Transparency: new NumberSequence([
                            new NumberSequenceKeypoint(0, 0.7),
                            new NumberSequenceKeypoint(1, 0.7),
                        ]),
                    }),

                    Fusion.New("TextLabel")({
                        Name: "PurchaseSlotTitle",
                        AnchorPoint: new Vector2(0.5, 0.5),
                        BackgroundTransparency: 1,
                        FontFace: new Font(
                            "rbxasset://fonts/families/Guru.json",
                            Enum.FontWeight.Bold,
                            Enum.FontStyle.Normal,
                        ),
                        Position: new UDim2(0.5, 0, 0.720064, 0),
                        Size: new UDim2(0.750028, 0, 0.0874271, 0),
                        Text: "Purchase Slot",
                        TextColor3: new Color3(1, 1, 1),
                        TextScaled: true,

                        [Children]: [
                            Fusion.New("UIStroke")({
                                Name: "UIStroke",
                                Thickness: 2.5,
                            }),
                        ],
                    }),
                ],
            }),

            Fusion.New("UIScale")({
                Name: "UIScale",
            }),

            Fusion.New("Frame")({
                Name: "CurrentSlotFrame",
                AnchorPoint: new Vector2(0.5, 0.5),
                BackgroundTransparency: 1,
                Position: new UDim2(0.5, 0, 0.5, 0),
                Size: new UDim2(1, 0, 1, 0),
                Visible: false,

                [Children]: [
                    Fusion.New("UIScale")({
                        Name: "UIScale",
                    }),

                    Fusion.New("Frame")({
                        Name: "Side",
                        AnchorPoint: new Vector2(0.5, 0.5),
                        BackgroundColor3: new Color3(1, 1, 1),
                        BorderColor3: new Color3(),
                        BorderSizePixel: 0,
                        Position: new UDim2(0.5, 0, 0.5, 0),
                        Size: new UDim2(1, 0, 1, 0),

                        [Children]: [
                            Fusion.New("UIGradient")({
                                Name: "GhoulGradient",
                                Color: new ColorSequence([
                                    new ColorSequenceKeypoint(0, Color3.fromRGB(212, 0, 0)),
                                    new ColorSequenceKeypoint(1, new Color3()),
                                ]),
                                Rotation: 90,
                                Transparency: new NumberSequence([
                                    new NumberSequenceKeypoint(0, 0.7),
                                    new NumberSequenceKeypoint(1, 0.7),
                                ]),
                            }),

                            Fusion.New("UIGradient")({
                                Name: "CCGGradient",
                                Color: new ColorSequence([
                                    new ColorSequenceKeypoint(0, Color3.fromRGB(0, 122, 179)),
                                    new ColorSequenceKeypoint(1, new Color3()),
                                ]),
                                Enabled: false,
                                Rotation: 90,
                                Transparency: new NumberSequence([
                                    new NumberSequenceKeypoint(0, 0.7),
                                    new NumberSequenceKeypoint(1, 0.7),
                                ]),
                            }),
                        ],
                    }),

                    Fusion.New("ViewportFrame")({
                        Name: "ViewportFrame",
                        AnchorPoint: new Vector2(0.5, 0.5),
                        BackgroundTransparency: 1,
                        Position: new UDim2(0.5, 0, 0.5, 0),
                        Size: new UDim2(1, 0, 1, 0),

                        [Children]: [
                            Fusion.New("Folder")({
                                Name: "Objects",
                            }),
                        ],
                    }),

                    Fusion.New("TextLabel")({
                        Name: "SlotName",
                        AnchorPoint: new Vector2(0.5, 0.5),
                        BackgroundTransparency: 1,
                        FontFace: new Font(
                            "rbxasset://fonts/families/Guru.json",
                            Enum.FontWeight.Bold,
                            Enum.FontStyle.Normal,
                        ),
                        Position: new UDim2(0.49655, 0, 0.0569997, 0),
                        Size: new UDim2(0.777123, 0, 0.0870325, 0),
                        Text: "Seindor Yoshimura",
                        TextColor3: new Color3(1, 1, 1),
                        TextScaled: true,
                        ZIndex: 2,

                        [Children]: [
                            Fusion.New("UIStroke")({
                                Name: "UIStroke",
                                Thickness: 2.5,
                            }),
                        ],
                    }),

                    Fusion.New("TextLabel")({
                        Name: "Class",
                        AnchorPoint: new Vector2(0.5, 0.5),
                        BackgroundTransparency: 1,
                        FontFace: new Font(
                            "rbxasset://fonts/families/Guru.json",
                            Enum.FontWeight.Bold,
                            Enum.FontStyle.Normal,
                        ),
                        Position: new UDim2(0.49655, 0, 0.134732, 0),
                        Size: new UDim2(0.777123, 0, 0.0687661, 0),
                        Text: "SSS Rated",
                        TextColor3: new Color3(1, 1, 1),
                        TextScaled: true,
                        ZIndex: 2,

                        [Children]: [
                            Fusion.New("UIStroke")({
                                Name: "UIStroke",
                                Thickness: 2.5,
                            }),

                            Fusion.New("UIGradient")({
                                Name: "UIGradient",
                                Color: new ColorSequence([
                                    new ColorSequenceKeypoint(0, Color3.fromRGB(255, 244, 201)),
                                    new ColorSequenceKeypoint(1, Color3.fromRGB(255, 244, 201)),
                                ]),
                            }),
                        ],
                    }),

                    Fusion.New("TextLabel")({
                        Name: "SelectedTitle",
                        AnchorPoint: new Vector2(0.5, 0.5),
                        BackgroundTransparency: 1,
                        FontFace: new Font(
                            "rbxasset://fonts/families/Guru.json",
                            Enum.FontWeight.Bold,
                            Enum.FontStyle.Normal,
                        ),
                        Position: new UDim2(0.49655, 0, 0.937729, 0),
                        Size: new UDim2(0.777123, 0, 0.0870325, 0),
                        Text: "Selected",
                        TextColor3: new Color3(1, 1, 1),
                        TextScaled: true,
                        Visible: false,
                        ZIndex: 2,

                        [Children]: [
                            Fusion.New("UIStroke")({
                                Name: "UIStroke",
                                Thickness: 2.5,
                            }),
                        ],
                    }),
                ],
            }),

            Fusion.New("Frame")({
                Name: "EmptySlotFrame",
                AnchorPoint: new Vector2(0.5, 0.5),
                BackgroundColor3: new Color3(1, 1, 1),
                BorderColor3: new Color3(),
                BorderSizePixel: 0,
                Position: new UDim2(0.5, 0, 0.5, 0),
                Size: new UDim2(1, 0, 1, 0),
                Visible: false,

                [Children]: [
                    Fusion.New("UIScale")({
                        Name: "UIScale",
                    }),

                    Fusion.New("UIGradient")({
                        Name: "NewSlotGradient",
                        Color: new ColorSequence([
                            new ColorSequenceKeypoint(0, Color3.fromRGB(179, 179, 179)),
                            new ColorSequenceKeypoint(1, new Color3()),
                        ]),
                        Rotation: 90,
                        Transparency: new NumberSequence([
                            new NumberSequenceKeypoint(0, 0.7),
                            new NumberSequenceKeypoint(1, 0.7),
                        ]),
                    }),

                    Fusion.New("TextLabel")({
                        Name: "Title_1",
                        AnchorPoint: new Vector2(0.5, 0.5),
                        BackgroundTransparency: 1,
                        FontFace: new Font(
                            "rbxasset://fonts/families/Guru.json",
                            Enum.FontWeight.Bold,
                            Enum.FontStyle.Normal,
                        ),
                        Position: new UDim2(0.5, 0, 0.45661, 0),
                        Size: new UDim2(0.89316, 0, 0.119128, 0),
                        Text: "This slot is empty.",
                        TextColor3: new Color3(1, 1, 1),
                        TextScaled: true,

                        [Children]: [
                            Fusion.New("UIStroke")({
                                Name: "UIStroke",
                                Thickness: 2.5,
                            }),
                        ],
                    }),

                    Fusion.New("TextLabel")({
                        Name: "Title_2",
                        AnchorPoint: new Vector2(0.5, 0.5),
                        BackgroundTransparency: 1,
                        FontFace: new Font(
                            "rbxasset://fonts/families/Guru.json",
                            Enum.FontWeight.Bold,
                            Enum.FontStyle.Normal,
                        ),
                        Position: new UDim2(0.5, 0, 0.593997, 0),
                        Size: new UDim2(0.931034, 0, 0.0934919, 0),
                        Text: "Click to create a character.",
                        TextColor3: new Color3(1, 1, 1),
                        TextScaled: true,

                        [Children]: [
                            Fusion.New("UIStroke")({
                                Name: "UIStroke",
                                Thickness: 2.5,
                            }),
                        ],
                    }),
                ],
            }),
        ],
    }) as ICharacterSlotTemplate;

    return characterSlotTemplate;
}
