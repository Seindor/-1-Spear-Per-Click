export type ICharacterSlots = {
    ["BackButton"]: {
        ["Title"]: {
            ["UIStroke"]: UIStroke;
        } & TextLabel;
        ["UIScale"]: UIScale;
        ["UIStroke1"]: UIStroke;
        ["UIStroke2"]: UIStroke;
    } & TextButton;
    ["Container"]: {
        ["UICorner"]: UICorner;
        ["UIListLayout"]: UIListLayout;
        ["UIPadding"]: UIPadding;
        ["UIStroke1"]: UIStroke;
        ["UIStroke2"]: UIStroke;
    } & ScrollingFrame;
    ["SelectSlotTitle"]: {
        ["UIStroke"]: UIStroke;
    } & TextLabel;
    ["UIScale"]: UIScale;
} & Frame;
