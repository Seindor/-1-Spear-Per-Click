// ─────────────────────────────────────────────
//  InputContext / Aggregates / ContextAggregate.ts
// ─────────────────────────────────────────────

import { UserInputService } from "@rbxts/services";
import { ContextCallback, ContextProperties } from "../Types/ContextTypes";

/**
 * Старая версия делала `UserInputService.IsKeyDown(key as Enum.KeyCode)`
 * даже если key на самом деле был Enum.UserInputType (например MouseButton1) —
 * combo с зажатой мышью никогда бы не сработало. Тут разводим по EnumType.
 */
function IsInputDown(input: Enum.KeyCode | Enum.UserInputType): boolean {
    if (input.EnumType === Enum.KeyCode) {
        return UserInputService.IsKeyDown(input as Enum.KeyCode);
    }

    const inputType = input as Enum.UserInputType;

    if (
        inputType === Enum.UserInputType.MouseButton1 ||
        inputType === Enum.UserInputType.MouseButton2 ||
        inputType === Enum.UserInputType.MouseButton3
    ) {
        return UserInputService.IsMouseButtonPressed(inputType);
    }

    return false;
}

export class ContextAggregate {
    public context: BoundActionInfo | {};
    public name: string;
    public bind: ContextCallback;
    public createTouchButton: boolean;
    public inputTypes: Array<Enum.KeyCode | Enum.UserInputType>;
    public priority?: number;
    public combo?: Array<Enum.KeyCode | Enum.UserInputType>;

    /** Отключённый контекст пропускает инпут дальше, не вызывая свой bind вообще */
    private enabled = true;

    constructor(contextProperties: ContextProperties) {
        this.name = contextProperties.name;
        this.createTouchButton = contextProperties.createTouchButton;
        this.priority = contextProperties.priority;
        this.inputTypes = contextProperties.inputTypes;
        this.combo = contextProperties.combo;
        this.context = {};

        let bind = contextProperties.bind;

        if (this.combo && this.combo.size() > 0) {
            const originalBind = bind;
            const combo = this.combo;

            bind = (actionName, inputState, inputObject) => {
                if (inputState === Enum.UserInputState.Begin) {
                    const allHeld = combo.every((key) => IsInputDown(key));

                    if (!allHeld) {
                        return Enum.ContextActionResult.Pass;
                    }
                }

                return originalBind(actionName, inputState, inputObject);
            };
        }

        const innerBind = bind;

        this.bind = (actionName, inputState, inputObject) => {
            if (!this.enabled) return Enum.ContextActionResult.Pass;
            return innerBind(actionName, inputState, inputObject);
        };
    }

    public SetEnabled(enabled: boolean): void {
        this.enabled = enabled;
    }

    public IsEnabled(): boolean {
        return this.enabled;
    }

    public OnSpawned() {}
    public OnRemoved() {}
}
