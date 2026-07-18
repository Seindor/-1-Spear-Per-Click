import type { GameEffect } from "../Types/GameEffectsQueueTypes";

export class GameEffectQueue {
    private effects: GameEffect[] = [];
    private nextOrder = 0;

    public getQueuedCount() {
        return this.effects.size();
    }

    public enqueue(effect: Omit<GameEffect, "order">): GameEffect {
        const finalEffect: GameEffect = {
            ...effect,
            order: this.nextOrder++,
        };
        this.effects.push(finalEffect);
        return finalEffect;
    }

    public drainSorted(): GameEffect[] {
        const drained = this.effects;
        this.effects = [];

        drained.sort((a, b) => {
            if (a.queuePriority !== b.queuePriority) return a.queuePriority < b.queuePriority;
            return a.order < b.order;
        });

        return drained;
    }

    public clear() {
        this.effects = [];
    }
}
