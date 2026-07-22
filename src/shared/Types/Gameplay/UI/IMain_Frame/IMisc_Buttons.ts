export type IMisc_Buttons = {
    ["Button_Spin_Wheel"]: {
        ["ExperienceTitle"]: {
            ["UIStroke"]: UIStroke;
        } & TextLabel;
        ["Icon"]: ImageLabel;
        ["Line"]: {
            ["UIStroke"]: UIStroke;
        } & Frame;
        ["UIScale"]: UIScale;
    } & TextButton;
} & Frame;
