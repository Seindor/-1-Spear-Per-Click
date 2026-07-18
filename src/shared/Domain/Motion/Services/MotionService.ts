import { MotionAggregate } from "../Aggregates/MotionAggregate";
import { MotionProperties } from "../Types/MotionTypes";

export class MotionService {
    public motions = new Map<string, Map<string, MotionAggregate>>();

    private resolveMotionName(motionName?: string): string {
        return motionName ?? "Motion";
    }

    public CreateMotion(
        motionProperties: MotionProperties,
        ownerId?: string,
        motionName?: string,
    ): MotionAggregate {
        const resolvedMotionName = this.resolveMotionName(motionName);

        if (ownerId) {
            if (!this.motions.has(ownerId)) {
                this.motions.set(ownerId, new Map<string, MotionAggregate>());
            }

            const ownerMotions = this.motions.get(ownerId)!;

            if (ownerMotions.has(resolvedMotionName)) {
                return ownerMotions.get(resolvedMotionName)!;
            }

            const motion = new MotionAggregate(motionProperties);
            ownerMotions.set(resolvedMotionName, motion);

            return motion;
        }

        return new MotionAggregate(motionProperties);
    }

    public GetActorMotion(ownerId: string, motionName?: string): MotionAggregate | undefined {
        const ownerMotions = this.motions.get(ownerId);
        if (!ownerMotions) {
            return undefined;
        }

        return ownerMotions.get(this.resolveMotionName(motionName));
    }

    public GetActorMotions(ownerId: string): Map<string, MotionAggregate> | undefined {
        return this.motions.get(ownerId);
    }

    public HasActorMotion(ownerId: string, motionName?: string): boolean {
        const ownerMotions = this.motions.get(ownerId);
        if (!ownerMotions) {
            return false;
        }

        return ownerMotions.has(this.resolveMotionName(motionName));
    }

    public RemoveActorMotion(ownerId: string, motionName?: string): boolean {
        const ownerMotions = this.motions.get(ownerId);
        if (!ownerMotions) {
            return false;
        }

        const resolvedMotionName = this.resolveMotionName(motionName);
        const motion = ownerMotions.get(resolvedMotionName);

        if (!motion) {
            return false;
        }

        motion.Destroy();
        ownerMotions.delete(resolvedMotionName);

        if (ownerMotions.size() === 0) {
            this.motions.delete(ownerId);
        }

        return true;
    }

    public RemoveActorMotions(ownerId: string): boolean {
        const ownerMotions = this.motions.get(ownerId);
        if (!ownerMotions) {
            return false;
        }

        const motionNames = new Array<string>();

        for (const [motionName] of ownerMotions) {
            motionNames.push(motionName);
        }

        for (const motionName of motionNames) {
            const motion = ownerMotions.get(motionName);
            if (!motion) continue;

            motion.Destroy();
            ownerMotions.delete(motionName);
        }

        this.motions.delete(ownerId);
        return true;
    }
}
