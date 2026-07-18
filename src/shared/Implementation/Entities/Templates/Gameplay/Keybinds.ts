import { IRuntimeBind } from "shared/Types/Database/Keybinds";

export const DefaultMainBinds: Record<string, IRuntimeBind> = {
    M1: {
        inputTypes: [Enum.UserInputType.MouseButton1],
    },

    M2: {
        inputTypes: [Enum.UserInputType.MouseButton2],
    },

    Critical: {
        inputTypes: [Enum.KeyCode.R],
    },

    Block: {
        inputTypes: [Enum.KeyCode.F],
    },

    Equip: {
        inputTypes: [Enum.KeyCode.E],
    },

    Interact: {
        inputTypes: [Enum.KeyCode.T],
    },

    Dash: {
        inputTypes: [Enum.KeyCode.Q],
    },

    Run: {
        inputTypes: [Enum.KeyCode.LeftShift],
    },

    Control: {
        inputTypes: [Enum.KeyCode.LeftControl],
    },
};

export const DefaultHotbarBinds: Record<string, IRuntimeBind> = {
    Slot_1: {
        inputTypes: [Enum.KeyCode.One],
    },
    Slot_2: {
        inputTypes: [Enum.KeyCode.Two],
    },
    Slot_3: {
        inputTypes: [Enum.KeyCode.Three],
    },
    Slot_4: {
        inputTypes: [Enum.KeyCode.Four],
    },
    Slot_5: {
        inputTypes: [Enum.KeyCode.Five],
    },
    Slot_6: {
        inputTypes: [Enum.KeyCode.Six],
    },
    Slot_7: {
        inputTypes: [Enum.KeyCode.Seven],
    },
    Slot_8: {
        inputTypes: [Enum.KeyCode.Eight],
    },
    Slot_9: {
        inputTypes: [Enum.KeyCode.Nine],
    },
    Slot_10: {
        inputTypes: [Enum.KeyCode.Zero],
    },
    Slot_11: {
        inputTypes: [Enum.KeyCode.Minus],
    },
    Slot_12: {
        inputTypes: [Enum.KeyCode.Equals],
    },
};
