import type { GameEffectHandler } from "../Types/GameEffectsQueueTypes";

export class GameEffectRegistry {
    private handlers = new Map<string, GameEffectHandler>();

    public registerHandler(effectType: string, handler: GameEffectHandler) {
        this.handlers.set(effectType, handler);
    }

    public getHandler(effectType: string): GameEffectHandler | undefined {
        return this.handlers.get(effectType);
    }
}
