import { Janitor } from "@rbxts/janitor";
import { RunService } from "@rbxts/services";
import { RenderDistanceCallbackType, RenderDistanceProperties } from "../Types/RenderDistanceTypes";

export class RenderDistanceAggregate {
    public instance: Instance;
    public origin: BasePart;

    private _Janitor = new Janitor<any>();

    private callbacks = new Map<RenderDistanceCallbackType, Map<string, Callback>>();

    public settings = {
        distance: 25,
    };

    public state = {
        visible: false,
    };

    constructor(public properties: RenderDistanceProperties) {
        this.instance = properties.instance;
        this.origin = properties.origin;

        this.settings.distance = properties.distance;

        this.init();
    }

    private init() {
        this._Janitor.Add(
            RunService.RenderStepped.Connect(() => {
                if (!this.instance.IsA("BasePart")) return;
                if (!this.origin) return;
                if (!this.instance) return;
                if (!this.origin.Parent) return;

                const targetPos = this.instance.Position;
                const originPos = this.origin.Position;

                const distance = targetPos.sub(originPos).Magnitude;

                const inRange = distance <= this.settings.distance;

                if (inRange && !this.state.visible) {
                    this.state.visible = true;
                    this.Fire("OnShown");
                }

                if (!inRange && this.state.visible) {
                    this.state.visible = false;
                    this.Fire("OnHidden");
                }
            }),
            "Disconnect",
            "RenderConnection",
        );

        this._Janitor.Add(
            this.instance.Destroying.Connect(() => {
                this.Fire("Destroying");
                this.Destroy();
            }),
        );
    }

    public AddCallback(event: RenderDistanceCallbackType, id: string, cb: Callback) {
        if (!this.callbacks.has(event)) {
            this.callbacks.set(event, new Map());
        }

        this.callbacks.get(event)!.set(id, cb);
    }

    public RemoveCallback(event: RenderDistanceCallbackType, id: string) {
        this.callbacks.get(event)?.delete(id);
    }

    public RemoveAllCallbacks() {
        this.callbacks.clear();
    }

    public Fire(event: RenderDistanceCallbackType, ...args: unknown[]) {
        const map = this.callbacks.get(event);
        if (!map) return;

        for (const [_index, cb] of map) {
            this._Janitor.Add(
                task.spawn(() => cb(...args)),
                true,
                _index,
            );
        }
    }

    public Destroy() {
        this._Janitor.Cleanup();
        this.callbacks.clear();
    }
}
