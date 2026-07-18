import type { GameEffectsLimitsPolicy } from "../Types/GameEffectsQueueTypes";
import type {
    GameEffect,
    GameEffectHandler,
    GameEffectResult,
    GameEffectsStepContext,
} from "../Types/GameEffectsQueueTypes";

import { GameEffectQueue } from "../Aggregates/GameEffectsQueue";
import { GameEffectRegistry } from "../Services/GameEffectsRegistry";
import { GameEffectsLimitsResolver } from "../Services/GameEffectsLimitResolver";
import { GameEffectExecutor } from "../Services/GameEffectsExecutor";

import type { IGameEffectsLogger } from "../Types/GameEffectsHookTypes";
import { NullGameEffectsLogger } from "../Types/GameEffectsHookTypes";

const DefaultPolicy: GameEffectsLimitsPolicy = {
    defaultByStepType: {
        Default: { maxQueuedGameEffects: 64, maxExecutedGameEffects: 64, maxFlushPasses: 8 },
        PVP: { maxQueuedGameEffects: 128, maxExecutedGameEffects: 128, maxFlushPasses: 16 },
        PVE: { maxQueuedGameEffects: 256, maxExecutedGameEffects: 256, maxFlushPasses: 24 },
        Ultimate: { maxQueuedGameEffects: 512, maxExecutedGameEffects: 512, maxFlushPasses: 32 },
        Sandbox: { maxQueuedGameEffects: 1000, maxExecutedGameEffects: 1000, maxFlushPasses: 64 },
    },
    absoluteHardCap: {
        maxQueuedGameEffects: 5000,
        maxExecutedGameEffects: 5000,
        maxFlushPasses: 128,
    },
};

export class GameEffectsAPI {
    private registry: GameEffectRegistry;
    private limitsResolver: GameEffectsLimitsResolver;
    private executor: GameEffectExecutor;

    private configured = false;

    constructor() {
        this.registry = new GameEffectRegistry();
        this.limitsResolver = new GameEffectsLimitsResolver(DefaultPolicy);

        const logger = new NullGameEffectsLogger();
        this.executor = new GameEffectExecutor(this.registry, this.limitsResolver, logger);
    }

    public configure(policy?: GameEffectsLimitsPolicy, logger?: IGameEffectsLogger) {
        if (this.configured) {
            warn("GameEffectsAPI.configure() called more than once. Ignored.");
            return;
        }
        this.configured = true;

        if (policy) {
            this.limitsResolver = new GameEffectsLimitsResolver(policy);
        }

        const effectiveLogger = logger ?? new NullGameEffectsLogger();

        this.executor = new GameEffectExecutor(this.registry, this.limitsResolver, effectiveLogger);
    }

    public registerHandler(effectType: string, handler: GameEffectHandler) {
        this.registry.registerHandler(effectType, handler);
    }

    public createStepQueue() {
        return new GameEffectQueue();
    }

    public enqueue(
        step: GameEffectsStepContext,
        queue: GameEffectQueue,
        effect: Omit<GameEffect, "order">,
    ) {
        return this.executor.enqueue(step, queue, effect);
    }

    public flush(step: GameEffectsStepContext, queue: GameEffectQueue): GameEffectResult[] {
        return this.executor.flush(step, queue);
    }
}
