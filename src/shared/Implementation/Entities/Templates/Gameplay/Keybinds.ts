import { IRuntimeBind } from "shared/Types/Gameplay/Keybinds/Keybinds";

export const DefaultMainBinds: Record<string, IRuntimeBind> = {
    [`M1`]: {
        inputTypes: [Enum.UserInputType.MouseButton1, Enum.UserInputType.Touch],
    },
};
