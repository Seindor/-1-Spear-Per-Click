import Fusion, { Children } from "@rbxts/fusion";

export type ICharacterCreationButtonTemplate = {
    ["Icon"]: ImageLabel;
    ["UIScale"]: UIScale;
} & TextButton;

export function CreateCharacterCreationButtonTemplate(): ICharacterCreationButtonTemplate {
    const characterSlotTemplate = Fusion.New("TextButton")({
        Name: "CharacterCreationButton",
        AnchorPoint: new Vector2(0.5, 0.5),
        BackgroundTransparency: 1,
        FontFace: new Font("rbxasset://fonts/families/SourceSansPro.json"),
        Position: new UDim2(0.371551, 0, 0.400943, 0),
        Size: new UDim2(0.163, 0, 0.85, 0),
        Text: "",
        TextColor3: new Color3(),
        TextSize: 14,

        [Children]: [
            Fusion.New("ImageLabel")({
                Name: "Icon",
                AnchorPoint: new Vector2(0.5, 0.5),
                BackgroundTransparency: 1,
                ImageTransparency: 0.5,
                Position: new UDim2(0.5, 0, 0.5, 0),
                Size: new UDim2(1, 0, 1, 0),
            }),

            Fusion.New("UIScale")({
                Name: "UIScale",
            }),
        ],
    }) as ICharacterCreationButtonTemplate;

    return characterSlotTemplate;
}
