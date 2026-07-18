export type TraceLevel = ["Lite", "Full"][number];

export type TraceEvent = ["Step", "Numeric", "Action", "Proc", "Status", "Ability"][number];

export interface TraceEntryLite {
    time: number;
    event: TraceEvent;
    message: string;
    stepId?: string;
    sourceId?: string;
    targetId?: string;
    miscData?: Record<string, unknown>;
}
