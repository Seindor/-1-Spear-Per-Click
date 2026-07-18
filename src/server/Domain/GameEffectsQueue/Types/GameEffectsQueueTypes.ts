export const StepTypes = ["Default", "PVP", "PVE", "Ultimate", "Sandbox"] as const;
export type StepType = (typeof StepTypes)[number];

export type GameEffectsLimitsOverride = Partial<GameEffectsLimits>;

export type GameEffectsLimitModifierOperation = ["Add", "Multiply"][number];

export interface GameEffectsLimits {
    maxQueuedGameEffects: number;
    maxExecutedGameEffects: number;
    maxFlushPasses: number;
}

export interface GameEffectsLimitModifier {
    operation: GameEffectsLimitModifierOperation;

    allowedStepTypes?: StepType[];

    values: Partial<GameEffectsLimits>;

    debugLabel?: string;
}

export interface GameEffectsLimitsPolicy {
    defaultByStepType: Record<StepType, GameEffectsLimits>;

    absoluteHardCap: GameEffectsLimits;
}

export interface GameEffect {
    effectType: string;

    queuePriority: number;

    order: number;

    stepId?: string;
    stepType?: string;

    sourceId?: string;
    targetId?: string;

    debugLabel?: string;

    payload?: unknown;
}

export interface GameEffectResult {
    effect: GameEffect;
    applied: boolean;
    reason?: string;
}

export interface GameEffectsStepContext {
    stepId: string;
    stepType: StepType;

    ownerId: string;

    sourceId?: string;
    targetId?: string;

    limitsOverride?: GameEffectsLimitsOverride;
    limitModifiers?: GameEffectsLimitModifier[];
}

export interface GameEffectHandlerContext {
    enqueue(effect: Omit<GameEffect, "order">): GameEffect | undefined;

    step: GameEffectsStepContext;
}

export type GameEffectHandler = (effect: GameEffect, ctx: GameEffectHandlerContext) => void;
