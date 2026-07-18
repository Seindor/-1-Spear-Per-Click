export const StatusIds = [
    "Stun",
    "Knocked",
    "Dead",
    "HyperArmor",
    "iFrame",
    "EndLag",
    "Loading",
] as const;
export type StatusId = (typeof StatusIds)[number] | (string & {});

export type StatusStackingPolicy = ["Refresh", "Add", "Ignore", "Replace"][number];
export type StatusStackBehavior = [
    "RefreshDuration",
    "KeepDuration",
    "IndependentStacks",
    "Cycle",
][number];

export interface ReplicatedStatus {
    id: StatusId;
    priority: number;
    spawned: number;
    duration: number;
    stacks?: number;
    stackBehavior?: string;
    tags?: string[];
    miscData?: Record<string, unknown>;
}

export type StatusEffectsState = Record<string, ReplicatedStatus[]>;
