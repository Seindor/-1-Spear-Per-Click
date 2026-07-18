import { HitboxConfig } from "../Types/HitboxTypes";

export class HitboxAggregate {
    public active = false;
    public elapsed = 0;

    public position = new CFrame();

    public hitCache = new Map<Instance, number>();

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

    public ClearTarget(target: Instance) {
        if (!this.hitCache.has(target)) return;
        this.hitCache.delete(target);
    }

    public CanHit(inst: Instance) {
        const now = os.clock();
        const last = this.hitCache.get(inst);

        if (last !== undefined && now - last < this.config.hitCooldown) {
            return false;
        }

        this.hitCache.set(inst, now);
        return true;
    }
}
