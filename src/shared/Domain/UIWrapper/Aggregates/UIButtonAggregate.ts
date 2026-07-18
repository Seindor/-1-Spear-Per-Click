import { Janitor } from "@rbxts/janitor";
import {
    GUIButtonCallbackType,
    PropertyChangedEvent,
    PropertyFromEvent,
    UIButtonEffectEntry,
} from "../Types/UIWrapperTypes";
import { UIButtonEffectsPrototypeKey, UIButtonEffectsPrototypes } from "../Prototypes/Effects";
import { IUIButtonAggregate } from "../Types/TypedAggregates";

export class UIButtonAggregate<T extends GuiButton = GuiButton> implements IUIButtonAggregate<T> {
    public instance: T;
    public _Janitor = new Janitor<any>();
    private callbacks = new Map<GUIButtonCallbackType, Map<string, Callback>>();
    public miscData = new Map<string, any>();
    public effects = new Map<
        string,
        {
            wrapper: IUIButtonAggregate;
            Emit(...args: any[]): void;
        }
    >();

    constructor(guiButton: T) {
        this.instance = guiButton;
        this.initEvents();
    }

    private initEvents() {
        const bind = <K extends GUIButtonCallbackType>(eventName: K, signal: RBXScriptSignal) => {
            this._Janitor.Add(
                signal.Connect((...args: unknown[]) => {
                    this.Fire(eventName, ...args);
                }),
                "Disconnect",
                tostring(eventName),
            );
        };

        bind("Activated", this.instance.Activated);
        bind("MouseEnter", this.instance.MouseEnter);
        bind("MouseLeave", this.instance.MouseLeave);
        bind("MouseMoved", this.instance.MouseMoved);
        bind("MouseWheelForward", this.instance.MouseWheelForward);
        bind("MouseWheelBackward", this.instance.MouseWheelBackward);
        bind("MouseButton1Click", this.instance.MouseButton1Click);
        bind("MouseButton1Down", this.instance.MouseButton1Down);
        bind("MouseButton1Up", this.instance.MouseButton1Up);
        bind("MouseButton2Click", this.instance.MouseButton2Click);
        bind("MouseButton2Down", this.instance.MouseButton2Down);
        bind("MouseButton2Up", this.instance.MouseButton2Up);
        bind("SecondaryActivated", this.instance.SecondaryActivated);

        bind("InputBegan", this.instance.InputBegan);
        bind("InputEnded", this.instance.InputEnded);
        bind("InputChanged", this.instance.InputChanged);

        this._Janitor.Add(
            this.instance.Destroying.Connect(() => {
                this.Fire("Destroying");
                this.Destroy();
            }),
        );
    }

    public AddPropertyChangedCallback<E extends PropertyChangedEvent<T>>(
        event: E,
        id: string,
        cb: (value: WritableInstanceProperties<T>[PropertyFromEvent<T, E>]) => void,
    ) {
        const property = event.sub(1, event.size() - 7) as PropertyFromEvent<T, E>;

        this._Janitor.Add(
            this.instance.GetPropertyChangedSignal(property as never).Connect(() => {
                cb(this.instance[property]);
            }),
            "Disconnect",
            id,
        );

        return id;
    }

    public AddCallback(event: GUIButtonCallbackType, id: string, cb: Callback) {
        if (!this.callbacks.has(event)) {
            this.callbacks.set(event, new Map());
        }

        this.callbacks.get(event)!.set(id, cb);

        return id;
    }

    public RemoveCallback(event: GUIButtonCallbackType, id: string) {
        this.callbacks.get(event)?.delete(id);
    }

    public RemoveAllCallbacks() {
        this.callbacks.clear();
    }

    public Fire(event: GUIButtonCallbackType, ...args: unknown[]) {
        const map = this.callbacks.get(event);
        if (!map) return;

        for (const [i, cb] of map) {
            this._Janitor.Add(
                task.spawn(() => {
                    cb(...args);
                }),
                true,
                i,
            );
        }
    }

    public ApplyEffect(prototypes: UIButtonEffectsPrototypeKey[]) {
        for (const key of prototypes) {
            if (!this.effects.has(key)) {
                // Каст нужен по той же причине, что и во Frame-версии (см. комментарий там).
                const Effect = new UIButtonEffectsPrototypes[key](
                    this as unknown as IUIButtonAggregate,
                );
                this.effects.set(key, Effect);
            }
        }
    }

    public EmitEffect(entries: UIButtonEffectEntry[]) {
        for (const entry of entries) {
            const { Name, Params } = entry as {
                Name: UIButtonEffectsPrototypeKey;
                Params?: Record<string, unknown>;
            };

            let Effect;

            if (!this.effects.has(Name)) {
                Effect = new UIButtonEffectsPrototypes[Name](this as unknown as IUIButtonAggregate);
                this.effects.set(Name, Effect);
            } else {
                Effect = this.effects.get(Name);
            }

            Effect!.Emit(Params);
        }
    }

    public Destroy() {
        this.callbacks.clear();
        this._Janitor.Cleanup();
    }
}
