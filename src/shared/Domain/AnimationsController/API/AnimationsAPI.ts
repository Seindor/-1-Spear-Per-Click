import { AnimatorAggregate } from "../Aggregates/AnimatorAggregate";
import { AnimationsService } from "../Services/AnimationsService";
import { AnimatorProperties } from "../Types/AnimatorTypes";

export class AnimationsAPI {
    private service = new AnimationsService();

    public CreateAnimator(
        animatorProperties: AnimatorProperties,
        packName: string,
        ownerId?: string,
    ): AnimatorAggregate {
        return this.service.CreateAnimator(animatorProperties, packName, ownerId);
    }

    public GetActorAnimator(ownerId: string, animatorName?: string): AnimatorAggregate | undefined {
        return this.service.GetActorAnimator(ownerId, animatorName);
    }

    public GetActorAnimators(ownerId: string): Map<string, AnimatorAggregate> | undefined {
        return this.service.GetActorAnimators(ownerId);
    }

    public HasActorAnimator(ownerId: string, animatorName?: string): boolean {
        return this.service.HasActorAnimator(ownerId, animatorName);
    }

    public RemoveActorAnimator(
        ownerId: string,
        packName: string,
        stopAnimations?: boolean,
        destroyAnimator = true as boolean,
    ): boolean {
        return this.service.RemoveActorAnimator(ownerId, packName, stopAnimations, destroyAnimator);
    }

    public RemoveActorAnimators(ownerId: string, stopAnimations?: boolean): boolean {
        return this.service.RemoveActorAnimators(ownerId, stopAnimations);
    }
}
