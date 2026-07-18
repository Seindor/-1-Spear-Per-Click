// ─────────────────────────────────────────────
//  InputContext / Components / KeybindMapper.ts
// ─────────────────────────────────────────────

import type {
    IKeybinds,
    IRuntimeBind,
    InputType,
    ISavedBind,
} from "shared/Types/Database/Keybinds";

export class KeybindMapper {
    public static ResolveInputName(name: string): InputType | undefined {
        const keyCode = (Enum.KeyCode as unknown as Record<string, Enum.KeyCode>)[name];
        if (keyCode) return keyCode;

        const inputType = (Enum.UserInputType as unknown as Record<string, Enum.UserInputType>)[
            name
        ];
        if (inputType) return inputType;

        warn(`[KeybindMapper] Unknown input name "${name}" — skipping`);
        return undefined;
    }

    public static ResolveSavedBind(saved: ISavedBind): IRuntimeBind | undefined {
        const inputTypes: InputType[] = [];

        for (const name of saved.inputTypes) {
            const resolved = KeybindMapper.ResolveInputName(name);
            if (resolved !== undefined) inputTypes.push(resolved);
        }

        if (inputTypes.size() === 0) return undefined;

        let combo: InputType[] | undefined;

        if (saved.combo) {
            combo = [];

            for (const name of saved.combo) {
                const resolved = KeybindMapper.ResolveInputName(name);
                if (resolved !== undefined) combo.push(resolved);
            }
        }

        return { inputTypes, combo };
    }

    public static MergeWithDefaults(
        saved: IKeybinds,
        defaults: Record<string, IRuntimeBind>,
    ): Record<string, IRuntimeBind> {
        const result: Record<string, IRuntimeBind> = { ...defaults };

        for (const [actionName, savedBind] of pairs(saved)) {
            const runtime = KeybindMapper.ResolveSavedBind(savedBind);
            if (runtime) result[actionName as string] = runtime;
        }

        return result;
    }
}
