import { Janitor } from "@rbxts/janitor";
import { HandlerGroup, PassiveProperties } from "../Types/PassiveTypes";
import { TableHelper } from "shared/Utilities/TableHelper";

export class PassiveAggregate {
    public ownerId: string;
    public name: string;
    public handlers = {} as Record<string, HandlerGroup>;

    public _janitor = new Janitor<any>();

    public miscData = new Map<string, unknown>();

    constructor(passiveProperites: PassiveProperties) {
        this.ownerId = passiveProperites.ownerId;
        this.name = passiveProperites.name;
        this.handlers = passiveProperites.handlers ?? {};
    }

    private attachAllGropus() {
        for (const [groupName, group] of pairs(this.handlers)) {
            this.AttachGroup(groupName);
        }
    }

    public AttachGroup(groupName: string) {
        const group = this.handlers[groupName];
        if (!group) return;

        group._janitor.Cleanup();

        for (let i = 0; i < group.subscribers.size(); i++) {
            const spec = group.subscribers[i];

            const conn =
                spec.once === true
                    ? group.bus.Once(spec.eventName, spec.callback, spec.priority)
                    : group.bus.Subscribe(spec.eventName, spec.callback, spec.priority);

            group._janitor.Add(conn, "Disconnect");
        }

        this._janitor.Add(group._janitor, "Cleanup", `Group:${groupName}`);
    }

    public DetachGroup(groupName: string) {
        const group = this.handlers[groupName];
        if (!group) return;
        group._janitor.Cleanup();
    }

    public Destroy() {
        this._janitor.Cleanup();

        for (const [, group] of pairs(this.handlers)) {
            group._janitor.Cleanup();
        }

        this.handlers = {};
        this.miscData.clear();
    }
}
