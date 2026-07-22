import { IStats_Products_Buttons } from "./IStats_Products_Buttons";

export type IProducts_Buttons = {
    [`Stats_Products_Buttons`]: IStats_Products_Buttons;
    ["Button_Level_Up_Product"]: {
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
    ["Button_Multiplier_Stat_Product"]: {
        ["Amount_Title"]: {
            ["UIStroke"]: UIStroke;
        } & TextLabel;
        ["CanvasGroup"]: {
            ["StudTexture"]: ImageLabel;
        } & CanvasGroup;
        ["Only_Title"]: {
            ["UIGradient"]: UIGradient;
            ["UIStroke"]: UIStroke;
        } & TextLabel;
        ["Permanent_Title"]: {
            ["UIGradient"]: UIGradient;
            ["UIStroke"]: UIStroke;
        } & TextLabel;
        ["Product_Icon"]: ImageLabel;
        ["UIGradient"]: UIGradient;
        ["UIScale"]: UIScale;
        ["UIStroke"]: UIStroke;
        ["UIStroke1"]: UIStroke;
    } & TextButton;
    ["Button_Multiplier_Wins_Product"]: {
        ["Amount_Title"]: {
            ["UIStroke"]: UIStroke;
        } & TextLabel;
        ["CanvasGroup"]: {
            ["StudTexture"]: ImageLabel;
        } & CanvasGroup;
        ["Only_Title"]: {
            ["UIGradient"]: UIGradient;
            ["UIStroke"]: UIStroke;
        } & TextLabel;
        ["Permanent_Title"]: {
            ["UIGradient"]: UIGradient;
            ["UIStroke"]: UIStroke;
        } & TextLabel;
        ["Product_Icon"]: ImageLabel;
        ["UIGradient"]: UIGradient;
        ["UIScale"]: UIScale;
        ["UIStroke"]: UIStroke;
        ["UIStroke1"]: UIStroke;
    } & TextButton;
    ["Button_OP_Pet"]: {
        ["Amount_Title"]: {
            ["UIGradient"]: UIGradient;
            ["UIStroke"]: UIStroke;
        } & TextLabel;
        ["Icon"]: ImageLabel;
        ["Only_Title"]: {
            ["UIGradient"]: UIGradient;
            ["UIStroke"]: UIStroke;
        } & TextLabel;
        ["Pet_Name_Title"]: {
            ["UIGradient"]: UIGradient;
            ["UIStroke"]: UIStroke;
        } & TextLabel;
        ["Sunrays"]: ImageLabel;
        ["UIAspectRatioConstraint"]: UIAspectRatioConstraint;
        ["UIScale"]: UIScale;
    } & ImageButton;
} & Frame;
