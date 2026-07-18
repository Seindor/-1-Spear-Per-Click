export type ICharacterCreation = {
    ["ConfirmButton"]: {
        ["FailedGradient"]: UIGradient;
        ["SuccsessGradient"]: UIGradient;
        ["Title"]: {
            ["UIStroke"]: UIStroke;
        } & TextLabel;
        ["UICorner"]: UICorner;
    } & TextButton;
    ["EnterName"]: {
        ["Line"]: {
            ["UICorner"]: UICorner;
            ["UIGradient"]: UIGradient;
        } & Frame;
        ["TextBox"]: {
            ["UIStroke"]: UIStroke;
        } & TextBox;
        ["UIScale"]: UIScale;
    } & Frame;
    ["GenderTitle"]: {
        ["Title"]: {
            ["UIStroke"]: UIStroke;
        } & TextLabel;
        ["UICorner"]: UICorner;
        ["UIGradient"]: UIGradient;
        ["UIScale"]: UIScale;
    } & Frame;
    ["RaceTitle"]: {
        ["Title"]: {
            ["UIStroke"]: UIStroke;
        } & TextLabel;
        ["UICorner"]: UICorner;
        ["UIGradient"]: UIGradient;
        ["UIScale"]: UIScale;
    } & Frame;
    ["SelectGender"]: {
        ["ContainerBackground"]: {
            ["Container"]: {
                ["UIListLayout"]: UIListLayout;
            } & ScrollingFrame;
            ["UICorner"]: UICorner;
            ["UIGradient"]: UIGradient;
        } & Frame;
    } & Frame;
    ["SelectRace"]: {
        ["ContainerBackground"]: {
            ["Container"]: {
                ["UIListLayout"]: UIListLayout;
            } & ScrollingFrame;
            ["UICorner"]: UICorner;
            ["UIGradient"]: UIGradient;
        } & Frame;
    } & Frame;
    ["UIScale"]: UIScale;
    ["Vignette"]: ImageLabel;
} & Frame;
