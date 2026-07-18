import { Janitor } from "@rbxts/janitor";
import { UIButtonEffectsPrototypeKey, UIFrameEffectsPrototypeKey } from "../Prototypes/Effects";
import {
    FrameInstanceType,
    GUIButtonCallbackType,
    GUIFrameCallbackType,
    PropertyChangedEvent,
    PropertyFromEvent,
    UIButtonEffectEntry,
    UIFrameEffectEntry,
} from "./UIWrapperTypes";

export interface IUIButtonAggregate<T extends GuiButton = GuiButton> {
    instance: T;
    _Janitor: Janitor<any>;
    miscData: Map<string, any>;

    effects: Map<
        string,
        {
            wrapper: IUIButtonAggregate;
            Emit(...args: any[]): void;
        }
    >;

    AddPropertyChangedCallback<E extends PropertyChangedEvent<T>>(
        event: E,
        id: string,
        cb: (value: WritableInstanceProperties<T>[PropertyFromEvent<T, E>]) => void,
    ): string;

    AddCallback(event: GUIButtonCallbackType, id: string, cb: Callback): void;
    RemoveCallback(event: GUIButtonCallbackType, id: string): void;
    RemoveAllCallbacks(): void;

    Fire(event: GUIButtonCallbackType, ...args: unknown[]): void;

    ApplyEffect(prototypes: UIButtonEffectsPrototypeKey[]): void;
    EmitEffect(entries: UIButtonEffectEntry[]): void;

    Destroy(): void;
}

export interface IUIFrameAggregate<T extends FrameInstanceType = FrameInstanceType> {
    instance: T;
    _Janitor: Janitor<any>;
    miscData: Map<string, any>;

    effects: Map<
        string,
        {
            wrapper: IUIFrameAggregate;
            Emit(...args: any[]): void;
        }
    >;

    AddPropertyChangedCallback<E extends PropertyChangedEvent<T>>(
        event: E,
        id: string,
        cb: (value: WritableInstanceProperties<T>[PropertyFromEvent<T, E>]) => void,
    ): string;

    AddCallback(event: GUIFrameCallbackType, id: string, cb: Callback): void;
    RemoveCallback(event: GUIFrameCallbackType, id: string): void;
    RemoveAllCallbacks(): void;

    Fire(event: GUIFrameCallbackType, ...args: unknown[]): void;

    ApplyEffect(prototypes: UIFrameEffectsPrototypeKey[]): void;
    EmitEffect(entries: UIFrameEffectEntry[]): void;

    Destroy(): void;
}
