import { HitboxConfig } from "../Types/HitboxTypes";

export class HitboxAggregate {
    public active = false;
    public elapsed = 0;

    public position = new CFrame();

    public hitCache = new Map<BasePart, number>();

    constructor(
        public readonly id: string,
        public config: HitboxConfig,
        public owner?: BasePart | Model,
    ) {}

    public Enable() {
        this.active = true;
        this.elapsed = 0;
    }

    public Disable() {
        this.active = false;
    }

    public Destroy() {
        this.active = false;
        this.elapsed = 0;
        this.hitCache.clear();
    }

    public Step(dt: number) {
        if (!this.active) return;

        this.elapsed += dt;

        if (this.elapsed >= this.config.lifetime) {
            this.Destroy();
        }
    }

    public ClearTarget(target: BasePart) {
        if (!this.hitCache.has(target)) return;
        this.hitCache.delete(target);
    }

    public CanHit(target: BasePart) {
        const now = os.clock();
        const last = this.hitCache.get(target);

        if (last !== undefined && now - last < this.config.hitCooldown) {
            return false;
        }

        this.hitCache.set(target, now);
        return true;
    }
}
