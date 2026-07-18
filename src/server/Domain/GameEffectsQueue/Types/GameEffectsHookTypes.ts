import type { StepType, GameEffect } from "./GameEffectsQueueTypes";

export interface GameEffectsLogEvent {
    time: number;

    stepId: string;
    stepType: StepType;

    ownerId: string;
    sourceId?: string;
    targetId?: string;

    message: string;
    effect?: GameEffect;
}

export interface IGameEffectsLogger {
    log(event: GameEffectsLogEvent): void;
}

export class NullGameEffectsLogger implements IGameEffectsLogger {
    log(_event: GameEffectsLogEvent) {}
}
