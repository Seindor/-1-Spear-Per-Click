import type {
    StepType,
    GameEffectsLimits,
    GameEffectsLimitsPolicy,
    GameEffectsLimitModifier,
    GameEffectsLimitsOverride,
} from "../Types/GameEffectsQueueTypes";

function clampNumber(value: number, minValue: number, maxValue: number): number {
    if (value < minValue) return minValue;
    if (value > maxValue) return maxValue;
    return value;
}

function roundDown(value: number): number {
    return math.floor(value);
}

const Operations = {
    Add: (a: number, b: number) => a + b,
    Multiply: (a: number, b: number) => a * b,
} as const;

export class GameEffectsLimitsResolver {
    constructor(private policy: GameEffectsLimitsPolicy) {}

    public resolveEffectiveLimits(
        stepType: StepType,
        overrides?: GameEffectsLimitsOverride,
        modifiers?: GameEffectsLimitModifier[],
    ): GameEffectsLimits {
        const base = this.policy.defaultByStepType[stepType];

        const currentLimits: GameEffectsLimits = {
            maxQueuedGameEffects: overrides?.maxQueuedGameEffects ?? base.maxQueuedGameEffects,
            maxExecutedGameEffects:
                overrides?.maxExecutedGameEffects ?? base.maxExecutedGameEffects,
            maxFlushPasses: overrides?.maxFlushPasses ?? base.maxFlushPasses,
        };

        if (modifiers) {
            for (const mod of modifiers) {
                if (mod.allowedStepTypes && !mod.allowedStepTypes.includes(stepType)) continue;

                const op = Operations[mod.operation];

                for (const [key, value] of pairs(mod.values)) {
                    if (value === undefined) continue;

                    const typedKey = key as keyof GameEffectsLimits;

                    currentLimits[typedKey] = op(currentLimits[typedKey], value as number);
                }
            }
        }

        const hard = this.policy.absoluteHardCap;

        currentLimits.maxQueuedGameEffects = clampNumber(
            roundDown(currentLimits.maxQueuedGameEffects),
            0,
            hard.maxQueuedGameEffects,
        );

        currentLimits.maxExecutedGameEffects = clampNumber(
            roundDown(currentLimits.maxExecutedGameEffects),
            0,
            hard.maxExecutedGameEffects,
        );

        currentLimits.maxFlushPasses = clampNumber(
            roundDown(currentLimits.maxFlushPasses),
            1,
            hard.maxFlushPasses,
        );

        return currentLimits;
    }
}
