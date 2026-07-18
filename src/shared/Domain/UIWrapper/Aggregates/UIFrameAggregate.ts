import { Janitor } from "@rbxts/janitor";
import {
    FrameInstanceType,
    GUIFrameCallbackType,
    PropertyChangedEvent,
    PropertyFromEvent,
    UIFrameEffectEntry,
} from "../Types/UIWrapperTypes";
import { UIFrameEffectsPrototypeKey, UIFrameEffectsPrototypes } from "../Prototypes/Effects";
import { IUIFrameAggregate } from "../Types/TypedAggregates";

export class UIFrameAggregate<
    T extends FrameInstanceType = FrameInstanceType,
> implements IUIFrameAggregate<T> {
    public instance: T;
    public _Janitor = new Janitor<any>();
    private callbacks = new Map<GUIFrameCallbackType, Map<string, Callback>>();
    public miscData = new Map<string, any>();

    public effects = new Map<
        string,
        {
            wrapper: IUIFrameAggregate;
            Emit(...args: any[]): void;
        }
    >();

    constructor(guiObject: T) {
        this.instance = guiObject;
        this.initEvents();
    }

    private initEvents() {
        const bind = <K extends GUIFrameCallbackType>(eventName: K, signal: RBXScriptSignal) => {
            if (eventName === "Shown" || eventName === "Hidden") {
                this._Janitor.Add(
                    signal.Connect((...args: unknown[]) => {
                        if (this.instance.Visible) {
                            this.Fire("Shown", ...args);
                        } else {
                            this.Fire("Hidden", ...args);
                        }
                    }),
                );
            } else {
                this._Janitor.Add(
                    signal.Connect((...args: unknown[]) => {
                        this.Fire(eventName, ...args);
                    }),
                );
            }
        };

        bind("Shown", this.instance.GetStyledPropertyChangedSignal("Visible"));
        bind("Hidden", this.instance.GetStyledPropertyChangedSignal("Visible"));

        bind("MouseEnter", this.instance.MouseEnter);
        bind("MouseLeave", this.instance.MouseLeave);
        bind("MouseMoved", this.instance.MouseMoved);
        bind("MouseWheelForward", this.instance.MouseWheelForward);
        bind("MouseWheelBackward", this.instance.MouseWheelBackward);

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

    public AddCallback(event: GUIFrameCallbackType, id: string, cb: Callback) {
        if (!this.callbacks.has(event)) {
            this.callbacks.set(event, new Map());
        }

        this.callbacks.get(event)!.set(id, cb);

        return id;
    }

    public RemoveCallback(event: GUIFrameCallbackType, id: string) {
        this.callbacks.get(event)?.delete(id);
    }

    public RemoveAllCallbacks() {
        this.callbacks.clear();
    }

    public Fire(event: GUIFrameCallbackType, ...args: unknown[]) {
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

    public ApplyEffect(prototypes: UIFrameEffectsPrototypeKey[]) {
        for (const key of prototypes) {
            if (!this.effects.has(key)) {
                const Effect = new UIFrameEffectsPrototypes[key](
                    this as unknown as IUIFrameAggregate,
                );
                this.effects.set(key, Effect);
            }
        }
    }

    public EmitEffect(entries: UIFrameEffectEntry[]) {
        for (const entry of entries) {
            const { Name, Params } = entry as {
                Name: UIFrameEffectsPrototypeKey;
                Params?: Record<string, unknown>;
            };

            let Effect;

            if (!this.effects.has(Name)) {
                Effect = new UIFrameEffectsPrototypes[Name](this as unknown as IUIFrameAggregate);
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
