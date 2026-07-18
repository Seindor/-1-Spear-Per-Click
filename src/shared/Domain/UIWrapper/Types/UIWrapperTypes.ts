import {
    UIButtonEffectsPrototypeKey,
    UIButtonEffectsPrototypes,
    UIFrameEffectsPrototypeKey,
    UIFrameEffectsPrototypes,
} from "../Prototypes/Effects";

export type FrameInstanceType = Frame | TextLabel | ImageLabel | TextBox | GuiObject;

export type GUIButtonCallbackType = [
    "InputBegan",
    "InputEnded",
    "InputChanged",
    "Activated",
    "MouseEnter",
    "MouseLeave",
    "MouseMoved",
    "MouseWheelForward",
    "MouseWheelBackward",
    "MouseButton1Click",
    "MouseButton1Down",
    "MouseButton1Up",
    "MouseButton2Click",
    "MouseButton2Down",
    "MouseButton2Up",
    "SecondaryActivated",
    `GetPropertyChangedSignal`,
    "Destroying",
][number];

export type GUIFrameCallbackType = [
    "InputBegan",
    "InputEnded",
    "InputChanged",
    "Shown",
    "Hidden",
    "MouseEnter",
    "MouseLeave",
    "MouseMoved",
    "MouseWheelForward",
    "MouseWheelBackward",
    `GetPropertyChangedSignal`,
    "Destroying",
][number];

export type GUIButtonEventMap = {
    InputBegan: [input: InputObject];
    InputEnded: [input: InputObject];
    InputChanged: [input: InputObject];

    Activated: [];
    SecondaryActivated: [];

    MouseEnter: [];
    MouseLeave: [];
    MouseMoved: [x: number, y: number];

    MouseWheelForward: [];
    MouseWheelBackward: [];

    MouseButton1Click: [];
    MouseButton1Down: [];
    MouseButton1Up: [];

    MouseButton2Click: [];
    MouseButton2Down: [];
    MouseButton2Up: [];

    GetPropertyChangedSignal: [];
    Destroying: [];
};

export type GUIFrameEventMap = {
    InputBegan: [input: InputObject];
    InputEnded: [input: InputObject];
    InputChanged: [input: InputObject];

    Shown: [];
    Hidden: [];

    MouseEnter: [];
    MouseLeave: [];
    MouseMoved: [x: number, y: number];

    MouseWheelForward: [];
    MouseWheelBackward: [];

    GetPropertyChangedSignal: [];
    Destroying: [];
};

type UIFrameEffectParamsMap = {
    [K in UIFrameEffectsPrototypeKey]: Parameters<
        InstanceType<(typeof UIFrameEffectsPrototypes)[K]>["Emit"]
    >[0];
};

type UIButtonEffectParamsMap = {
    [K in UIButtonEffectsPrototypeKey]: Parameters<
        InstanceType<(typeof UIButtonEffectsPrototypes)[K]>["Emit"]
    >[0];
};

type FrameEffectEntry<K extends UIFrameEffectsPrototypeKey> =
    UIFrameEffectParamsMap[K] extends undefined
        ? { Name: K; Params?: never }
        : { Name: K; Params?: UIFrameEffectParamsMap[K] };

type ButtonEffectEntry<K extends UIButtonEffectsPrototypeKey> =
    UIButtonEffectParamsMap[K] extends undefined
        ? { Name: K; Params?: never }
        : { Name: K; Params?: UIButtonEffectParamsMap[K] };

export type UIFrameEffectEntry = {
    [K in UIFrameEffectsPrototypeKey]: FrameEffectEntry<K>;
}[UIFrameEffectsPrototypeKey];

export type UIButtonEffectEntry = {
    [K in UIButtonEffectsPrototypeKey]: ButtonEffectEntry<K>;
}[UIButtonEffectsPrototypeKey];

export type PropertyChangedEvent<T extends GuiObjects> =
    `${Extract<keyof WritableInstanceProperties<T>, string>}Changed`;

export type PropertyFromEvent<
    T extends GuiObjects,
    E extends PropertyChangedEvent<T>,
> = E extends `${infer P}Changed` ? P & keyof WritableInstanceProperties<T> : never;

export type GuiObjects = [
    GuiButton,
    GuiObject,
    TextBox,
    TextLabel,
    TextButton,
    ImageButton,
    ImageLabel,
    Frame,
    ScrollingFrame,
][number];
