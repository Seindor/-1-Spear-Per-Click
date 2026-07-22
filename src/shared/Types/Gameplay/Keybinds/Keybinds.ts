export type InputType = Enum.KeyCode | Enum.UserInputType;

export interface IRuntimeBind {
    inputTypes: InputType[];
    combo?: InputType[];
}

export interface ISavedBind {
    inputTypes: string[];
    combo?: string[];
}

export type IKeybinds = Record<string, ISavedBind>;
