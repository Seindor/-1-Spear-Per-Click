import { Janitor } from "@rbxts/janitor";
import { StatusAggregate } from "../Aggregates/StatusAggregate";
import {
    StatusId,
    StatusStackBehavior,
    StatusStackingPolicy,
} from "shared/Types/GlobalStatusEffectsTypes";

export type IStatusId = StatusId;
export type IStatusStackingPolicy = StatusStackingPolicy;
export type IStatusStackBehavior = StatusStackBehavior;

export const StatModifierTypes = ["Override", "Add", "Multiply", "ClampMax", "ClampMin"] as const;
export type StatModifierType = (typeof StatModifierTypes)[number];

export type ControlLevel = number;

export const ActorStats = ["WalkSpeed", "JumpPower", "Gravity"] as const;
export type ActorStat = (typeof ActorStats)[number];

export interface StackInstance {
    sourceId: string;
    spawned: number;
    duration: number;
    miscData?: Record<string, unknown>;
}

export interface Modifier {
    stat: ActorStat;
    type: StatModifierType;
    value: number | boolean | string;
}

export interface StatusDefinition {
    id: IStatusId;
    duration?: number;

    stackingPolicy: IStatusStackingPolicy;

    defaultBlacklist?: BlacklistedStatus[];
    defaultIgnorelist?: BlacklistedStatus[];
    defaultModifiers?: Modifier[];

    onApply?: (actorId: string, statusAggregate?: StatusAggregate) => void;
    onAdded?: (actorId: string, statusAggregate?: StatusAggregate) => void;
    onRemoved?: (actorId: string, statusAggregate?: StatusAggregate) => void;
    onCheck?: (actorId: string, statusAggregate?: StatusAggregate) => boolean | void;
}

export interface BlacklistedStatus {
    id: IStatusId;
    maxPriority?: number;
}

export interface StatusAggregateType {
    id: string;
    modifiers: Modifier[];

    priority: number;
    spawned: number;
    duration: number;

    stacks?: number;
    maxStacks?: number;
    stackInstances?: StackInstance[];
    stackingPolicy: IStatusStackingPolicy;
    stackBehavior?: IStatusStackBehavior;

    tags?: string[];
    miscData: Record<string, unknown>;

    blacklist?: BlacklistedStatus[];
    ignoreList?: BlacklistedStatus[];

    _janitor: Janitor<any>;

    onApply?: (actorId: string, statusAggregate?: StatusAggregate) => void;
    onAdded?: (actorId: string, statusAggregate?: StatusAggregate) => void;
    onRemoved?: (actorId: string, statusAggregate?: StatusAggregate) => void;
    onCheck?: (actorId: string, statusAggregate?: StatusAggregate) => boolean | void;
}

export interface StatusAggregateOptions {
    priority?: number;
    duration?: number;
    tags?: string[];

    stacks?: number;
    maxStacks?: number;
    stackInstances?: StackInstance[];
    stackingPolicy?: IStatusStackingPolicy;
    stackBehavior?: IStatusStackBehavior;

    customModifiers?: Modifier[];
    blacklist?: BlacklistedStatus[];
    ignoreList?: BlacklistedStatus[];

    stack?: StackInstance;

    onApply?: (actorId: string, statusAggregate?: StatusAggregate) => void;
    onAdded?: (actorId: string, statusAggregate?: StatusAggregate) => void;
    onRemoved?: (actorId: string, statusAggregate?: StatusAggregate) => void;
    onCheck?: (actorId: string, statusAggregate?: StatusAggregate) => boolean | void;
}
