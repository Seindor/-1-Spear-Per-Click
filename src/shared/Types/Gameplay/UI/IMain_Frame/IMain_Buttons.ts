export type IButton_Main = {
    ["Button_Title"]: {
        ["UIStroke"]: UIStroke;
    } & TextLabel;
    ["CanvasGroup"]: {
        ["StudTexture"]: ImageLabel;
    } & CanvasGroup;
    ["Icon"]: ImageLabel;
    ["Notification"]: {
        ["Title"]: {
            ["UIStroke"]: UIStroke;
        } & TextLabel;
        ["UICorner"]: UICorner;
        ["UIGradient"]: UIGradient;
        ["UIScale"]: UIScale;
        ["UIStroke"]: UIStroke;
        ["UIStroke1"]: UIStroke;
    } & Frame;
    ["UIGradient"]: UIGradient;
    ["UIScale"]: UIScale;
    ["UIStroke"]: UIStroke;
    ["UIStroke1"]: UIStroke;
} & TextButton;

export type IMain_Buttons = {
    ["Button_Boost"]: IButton_Main;
    ["Button_Index"]: IButton_Main;
    ["Button_Pets"]: IButton_Main;
    ["Button_Prestige"]: IButton_Main;
    ["Button_Rebirth"]: IButton_Main;
    ["Button_Shop"]: IButton_Main;
    ["Button_Teleport"]: IButton_Main;
    ["Button_Titles"]: IButton_Main;
    ["Button_Trade"]: IButton_Main;

    ["UIAspectRatioConstraint"]: UIAspectRatioConstraint;
    ["UIGridLayout"]: UIGridLayout;
    ["UIScale"]: UIScale;
} & Frame;
