import { Janitor } from "@rbxts/janitor";

type Callback = () => void;

type CallbackMap = {
    equip?: Callback;
    unequip?: Callback;
    activate?: Callback;
    deactivate?: Callback;
};

export class ToolAggregate {
    public name: string;
    public index: number = 1;
    public instance: Tool;
    public _janitor = new Janitor<any>();

    public state = {
        equipped: false,
        activated: false,
    };

    public settings = {
        toolType: "Switch" as "Switch" | "Holdable",
    };

    private callbacks: CallbackMap = {};

    constructor(name: string, toolIndex: number, instance: Tool, toolType?: "Switch" | "Holdable") {
        this.name = name;
        this.instance = instance;
        this.index = toolIndex;
        this.settings.toolType = toolType || "Switch";
    }

    public OnEquipped(callback: Callback): void {
        this.callbacks.equip = callback;

        const conn = this.instance.Equipped.Connect(() => {
            this.Fire("equip");
        });

        this._janitor.Add(conn, "Disconnect", "OnEquipped");
    }

    public OnUnequipped(callback: Callback): void {
        this.callbacks.unequip = callback;

        const conn = this.instance.Unequipped.Connect(() => {
            this.Fire("unequip");
        });

        this._janitor.Add(conn, "Disconnect", "OnUnequipped");
    }

    public OnActivated(callback: Callback): void {
        this.callbacks.activate = callback;

        const conn = this.instance.Activated.Connect(() => {
            this.Fire("activate");
        });

        this._janitor.Add(conn, "Disconnect", "OnActivated");
    }

    public OnDeactivated(callback: Callback): void {
        this.callbacks.deactivate = callback;

        const conn = this.instance.Deactivated.Connect(() => {
            this.Fire("deactivate");
        });

        this._janitor.Add(conn, "Disconnect", "OnDeactivated");
    }

    public Fire(callbackName: keyof CallbackMap): void {
        switch (callbackName) {
            case "equip":
                if (this.state.equipped) return;
                this.state.equipped = true;
                this.callbacks.equip?.();
                break;

            case "unequip":
                if (!this.state.equipped) return;
                this.callbacks.unequip?.();
                this.state.equipped = false;

                if (this.state.activated) {
                    this.Fire("deactivate");
                }
                break;

            case "activate":
                if (this.state.activated) return;
                this.state.activated = true;
                this.callbacks.activate?.();
                break;

            case "deactivate":
                if (!this.state.activated) return;
                this.callbacks.deactivate?.();
                this.state.activated = false;
                break;
        }
    }

    public OnDestroy(): void {
        print(`Destroyed ${this.name}`);
        this._janitor.Cleanup();
    }
}
