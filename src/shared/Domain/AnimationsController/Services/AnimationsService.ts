import { AnimatorAggregate } from "../Aggregates/AnimatorAggregate";
import { AnimatorProperties } from "../Types/AnimatorTypes";

export class AnimationsService {
    public animators = new Map<string, Map<string, AnimatorAggregate>>();

    private resolveAnimatorName(
        animatorProperties?: AnimatorProperties,
        animatorName?: string,
    ): string {
        return animatorName ?? animatorProperties?.AnimatorName ?? "Animator";
    }

    public CreateAnimator(
        animatorProperties: AnimatorProperties,
        packName: string,
        ownerId?: string,
    ): AnimatorAggregate {
        if (ownerId) {
            if (!this.animators.has(ownerId)) {
                this.animators.set(ownerId, new Map<string, AnimatorAggregate>());
            }

            const ownerAnimators = this.animators.get(ownerId)!;

            if (ownerAnimators.has(packName)) {
                const existing = ownerAnimators.get(packName)!;

                if (existing.animator.Parent !== undefined) {
                    return existing;
                }

                existing.Destroy();
                ownerAnimators.delete(packName);
            }

            const animator = new AnimatorAggregate(animatorProperties);
            ownerAnimators.set(packName, animator);

            return animator;
        }

        return new AnimatorAggregate(animatorProperties);
    }

    public GetActorAnimator(ownerId: string, animatorName?: string): AnimatorAggregate | undefined {
        const ownerAnimators = this.animators.get(ownerId);
        if (!ownerAnimators) {
            return undefined;
        }

        return ownerAnimators.get(this.resolveAnimatorName(undefined, animatorName));
    }

    public GetActorAnimators(ownerId: string): Map<string, AnimatorAggregate> | undefined {
        return this.animators.get(ownerId);
    }

    public HasActorAnimator(ownerId: string, animatorName?: string): boolean {
        const ownerAnimators = this.animators.get(ownerId);
        if (!ownerAnimators) {
            return false;
        }

        return ownerAnimators.has(this.resolveAnimatorName(undefined, animatorName));
    }

    public RemoveActorAnimator(
        ownerId: string,
        packName: string,
        stopAnimations?: boolean,
        destroyAnimator = true,
    ): boolean {
        const ownerAnimators = this.animators.get(ownerId);
        if (!ownerAnimators) return false;

        const animator = ownerAnimators.get(packName);
        if (!animator) return false;

        animator.Destroy(stopAnimations, destroyAnimator);
        ownerAnimators.delete(packName);

        if (ownerAnimators.size() === 0) {
            this.animators.delete(ownerId);
        }

        return true;
    }

    public RemoveActorAnimators(ownerId: string, stopAnimations?: boolean): boolean {
        const ownerAnimators = this.animators.get(ownerId);
        if (!ownerAnimators) {
            return false;
        }

        const animatorNames = new Array<string>();

        for (const [animatorName] of ownerAnimators) {
            animatorNames.push(animatorName);
        }

        for (const animatorName of animatorNames) {
            const animator = ownerAnimators.get(animatorName);
            if (!animator) continue;

            animator.Destroy(stopAnimations);
            ownerAnimators.delete(animatorName);
        }

        this.animators.delete(ownerId);
        return true;
    }
}
