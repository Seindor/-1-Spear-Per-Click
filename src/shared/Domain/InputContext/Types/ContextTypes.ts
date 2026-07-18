export type ContextCallback = (
    actionName: string,
    inputState: Enum.UserInputState,
    inputObject: InputObject,
) => Enum.ContextActionResult;

export interface ContextProperties {
    name: string;
    bind: ContextCallback;
    createTouchButton: boolean;
    inputTypes: (Enum.KeyCode | Enum.UserInputType)[];
    priority?: number;
    combo?: (Enum.KeyCode | Enum.UserInputType)[];
}
