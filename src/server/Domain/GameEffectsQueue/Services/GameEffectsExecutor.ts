import type {
    GameEffect,
    GameEffectResult,
    GameEffectsStepContext,
} from "../Types/GameEffectsQueueTypes";

import { GameEffectQueue } from "../Aggregates/GameEffectsQueue";
import { GameEffectRegistry } from "./GameEffectsRegistry";
import { GameEffectsLimitsResolver } from "./GameEffectsLimitResolver";

import type { IGameEffectsLogger } from "../Types/GameEffectsHookTypes";

export class GameEffectExecutor {
    constructor(
        private registry: GameEffectRegistry,
        private limitsResolver: GameEffectsLimitsResolver,
        private logger: IGameEffectsLogger,
    ) {}

    private log(step: GameEffectsStepContext, message: string, effect?: GameEffect) {
        this.logger.log({
            time: os.clock(),
            stepId: step.stepId,
            stepType: step.stepType,
            ownerId: step.ownerId,
            sourceId: step.sourceId,
            targetId: step.targetId,
            message,
            effect,
        });
    }

    public enqueue(
        step: GameEffectsStepContext,
        queue: GameEffectQueue,
        effect: Omit<GameEffect, "order">,
    ): GameEffect | undefined {
        const limits = this.limitsResolver.resolveEffectiveLimits(
            step.stepType,
            step.limitsOverride,
            step.limitModifiers,
        );

        if (queue.getQueuedCount() >= limits.maxQueuedGameEffects) {
            this.log(
                step,
                `GameEffects overflow on enqueue: reached maxQueuedGameEffects=${limits.maxQueuedGameEffects}`,
            );
            return undefined;
        }

        const queued = queue.enqueue({
            ...effect,
            stepId: step.stepId,
            stepType: step.stepType,
        });

        this.log(
            step,
            `queued GameEffect ${queued.effectType}${queued.debugLabel ? ` (${queued.debugLabel})` : ""}`,
            queued,
        );

        return queued;
    }

    public flush(step: GameEffectsStepContext, queue: GameEffectQueue): GameEffectResult[] {
        const limits = this.limitsResolver.resolveEffectiveLimits(
            step.stepType,
            step.limitsOverride,
            step.limitModifiers,
        );

        const results: GameEffectResult[] = [];

        let executedCount = 0;
        let passIndex = 0;

        while (passIndex < limits.maxFlushPasses) {
            passIndex++;

            const batch = queue.drainSorted();
            if (batch.size() === 0) break;

            for (let i = 0; i < batch.size(); i++) {
                const effect = batch[i];

                if (executedCount >= limits.maxExecutedGameEffects) {
                    this.log(
                        step,
                        `GameEffects overflow on execute: reached maxExecutedGameEffects=${limits.maxExecutedGameEffects}`,
                        effect,
                    );

                    results.push({ effect, applied: false, reason: "max_executed_reached" });

                    for (let j = i + 1; j < batch.size(); j++) {
                        results.push({
                            effect: batch[j],
                            applied: false,
                            reason: "max_executed_reached",
                        });
                    }

                    return results;
                }

                const handler = this.registry.getHandler(effect.effectType);
                if (!handler) {
                    results.push({ effect, applied: false, reason: "no_handler" });
                    this.log(step, `skipped GameEffect ${effect.effectType} (no handler)`, effect);
                    continue;
                }

                const exec = this;

                handler(effect, {
                    step,
                    enqueue(e) {
                        return exec.enqueue(step, queue, e);
                    },
                });
                executedCount++;

                results.push({ effect, applied: true });

                this.log(
                    step,
                    `executed GameEffect ${effect.effectType}${effect.debugLabel ? ` (${effect.debugLabel})` : ""}`,
                    effect,
                );
            }
        }

        if (passIndex >= limits.maxFlushPasses && queue.getQueuedCount() > 0) {
            this.log(
                step,
                `GameEffects stopped: reached maxFlushPasses=${limits.maxFlushPasses} with remaining queued effects`,
            );
        }

        return results;
    }
}
