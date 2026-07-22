export type ITop_Button = {
    ["Activated_Title"]: {
        ["UIStroke"]: UIStroke;
    } & TextLabel;
    ["Button_Title"]: {
        ["UIStroke"]: UIStroke;
    } & TextLabel;
    ["CanvasGroup"]: {
        ["StudTexture"]: ImageLabel;
    } & CanvasGroup;
    ["UIGradient"]: UIGradient;
    ["UIScale"]: UIScale;
    ["UIStroke"]: UIStroke;
    ["UIStroke1"]: UIStroke;
} & TextButton;

export type ITop_Buttons = {
    ["Button_AutoClicker"]: ITop_Button;
    ["Button_AutoWin"]: ITop_Button;
    ["UIListLayout"]: UIListLayout;
    ["UIScale"]: UIScale;
} & Frame;
