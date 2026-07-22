import { Workspace } from "@rbxts/services";

import {
    IStatusStackBehavior,
    StackInstance,
    IStatusId as StatusId,
    IStatusStackingPolicy as StatusStackingPolicy,
} from "../Types/StatusTypes";

import { Stun } from "../Definations/Stun";
import {
    StatusAggregateType,
    StatusAggregateOptions,
    StatusDefinition,
    Modifier,
    BlacklistedStatus,
} from "../Types/StatusTypes";

import { Janitor } from "@rbxts/janitor";
import { EquippedWeapon } from "../Definations/EquippedWeapon";

const Definitions: Partial<Record<StatusId, StatusDefinition>> = {
    Stun: Stun,
    EquippedWeapon: EquippedWeapon,
};

const defaultStatusTemplate = (id: StatusId): StatusDefinition => ({
    id,
    duration: math.huge,
    defaultModifiers: [],
    stackingPolicy: "Replace",
});

export class StatusAggregate implements StatusAggregateType {
    readonly id: StatusId;
    public modifiers: Modifier[];

    public priority: number;
    public spawned: number;
    public duration: number;

    public stacks?: number;
    public maxStacks: number;
    public stackInstances?: StackInstance[];
    readonly stackingPolicy: StatusStackingPolicy;
    public stackBehavior?: IStatusStackBehavior;

    public tags?: string[];
    public miscData: Record<string, unknown> = {};

    public blacklist?: BlacklistedStatus[];
    public ignoreList?: BlacklistedStatus[];

    public _janitor = new Janitor<any>();

    public onApply?: (actorId: string, statusAggregate?: StatusAggregate) => void;
    public onAdded?: (actorId: string, statusInstance?: StatusAggregate) => void;
    public onRemoved?: (actorId: string, statusInstance?: StatusAggregate) => void;
    public onCheck?: (actorId: string, statusInstance?: StatusAggregate) => boolean | void;

    constructor(statusId: StatusId, options?: StatusAggregateOptions) {
        const definition: StatusDefinition = Definitions[statusId]
            ? { ...Definitions[statusId] }
            : defaultStatusTemplate(statusId);

        this.id = definition.id;
        this.modifiers =
            options?.customModifiers ??
            (definition.defaultModifiers ? [...definition.defaultModifiers] : []);

        this.priority = options?.priority ?? 1;
        this.spawned = Workspace.GetServerTimeNow();
        this.duration = options?.duration ?? definition.duration ?? math.huge;

        this.stacks = options?.stacks ?? 1;
        this.maxStacks = options?.maxStacks ?? 1;
        this.stackInstances = options?.stackInstances ?? [];
        this.stackingPolicy = options?.stackingPolicy ?? definition.stackingPolicy ?? "Replace";
        this.stackBehavior = options?.stackBehavior ?? undefined;

        this.tags = options?.tags ?? [];
        this.miscData = {};

        this.blacklist = [...(definition.defaultBlacklist ?? []), ...(options?.blacklist ?? [])];
        this.ignoreList = [...(definition.defaultIgnorelist ?? []), ...(options?.ignoreList ?? [])];

        this.onApply =
            options?.onApply ??
            definition.onApply ??
            Definitions[`${statusId}`]?.onApply ??
            undefined;
        this.onAdded =
            options?.onAdded ??
            definition.onAdded ??
            Definitions[`${statusId}`]?.onAdded ??
            undefined;
        this.onRemoved =
            options?.onRemoved ??
            definition.onRemoved ??
            Definitions[`${statusId}`]?.onRemoved ??
            undefined;
        this.onCheck =
            options?.onCheck ??
            definition.onCheck ??
            Definitions[`${statusId}`]?.onCheck ??
            undefined;
    }

    apply(actorId: string) {
        this._janitor.Add(
            task.spawn(() => {
                this.onApply?.(actorId, this);
            }),
            true,
            `onApply`,
        );
    }

    add(actorId: string) {
        this._janitor.Add(
            task.spawn(() => {
                this.onAdded?.(actorId, this);
            }),
            true,
            `onAdded`,
        );
    }

    remove(actorId: string) {
        this._janitor.Add(
            task.spawn(() => {
                this.onRemoved?.(actorId, this);
            }),
            true,
            `onRemoved`,
        );
    }

    check(actorId: string): boolean {
        return this.onCheck?.(actorId, this) ?? true;
    }
}
