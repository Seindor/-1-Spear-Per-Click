export type IStats_Products_Button = {
    ["Amount_Title"]: {
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

export type IStats_Products_Buttons = {
    ["Button_1"]: IStats_Products_Button;
    ["Button_2"]: IStats_Products_Button;
    ["Button_3"]: IStats_Products_Button;

    ["UIListLayout"]: UIListLayout;
    ["UIScale"]: UIScale;
} & Frame;
