import { Janitor } from "@rbxts/janitor";
import { ClickDetectorCallbackType, ClickDetectorProperties } from "../Types/ClickDetectorTypes";

export class ClickDetectorAggregate {
    public name: string;
    public part: BasePart;

    public instance: ClickDetector;

    private _Janitor = new Janitor<any>();

    private callbacks = new Map<ClickDetectorCallbackType, Map<string, Callback>>();

    public settings: {
        maxActivationDistance: number;
        detectionRadius: number;
        enableHighlight: boolean;
    };

    public state = {
        hovering: false,
        playerInRadius: false,
    };

    constructor(
        public properties: ClickDetectorProperties,
        instance: ClickDetector,
    ) {
        this.name = properties.name;
        this.part = properties.parent;
        this.instance = instance;

        this.settings = {
            maxActivationDistance: properties.maxActivationDistance ?? 32,

            detectionRadius: properties.detectionRadius ?? 15,

            enableHighlight: properties.enableHighlight ?? true,
        };

        this.initEvents();
    }

    private initEvents() {
        const bind = (event: ClickDetectorCallbackType, signal: RBXScriptSignal) => {
            this._Janitor.Add(
                signal.Connect((...args: unknown[]) => {
                    this.Fire(event, ...args);
                }),
                "Disconnect",
                tostring(event),
            );
        };

        bind("MouseClick", this.instance.MouseClick);
        bind("RightMouseClick", this.instance.RightMouseClick);

        bind("MouseHoverEnter", this.instance.MouseHoverEnter);
        bind("MouseHoverLeave", this.instance.MouseHoverLeave);

        this._Janitor.Add(
            this.instance.Destroying.Connect(() => {
                this.Fire("Destroying");
                this.Destroy();
            }),
        );
    }

    public AddCallback(event: ClickDetectorCallbackType, id: string, cb: Callback) {
        if (!this.callbacks.has(event)) {
            this.callbacks.set(event, new Map());
        }

        this.callbacks.get(event)!.set(id, cb);
    }

    public RemoveCallback(event: ClickDetectorCallbackType, id: string) {
        this.callbacks.get(event)?.delete(id);
    }

    public RemoveAllCallbacks() {
        this.callbacks.clear();
    }

    public Fire(event: ClickDetectorCallbackType, ...args: unknown[]) {
        const map = this.callbacks.get(event);

        if (!map) return;

        for (const [id, cb] of map) {
            this._Janitor.Add(
                task.spawn(() => {
                    cb(...args);
                }),
                true,
                id,
            );
        }
    }

    public Destroy() {
        this.callbacks.clear();
        this._Janitor.Cleanup();
        this.instance.Destroy();
    }
}
