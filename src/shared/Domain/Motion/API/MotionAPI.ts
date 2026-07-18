import { MotionAggregate } from "../Aggregates/MotionAggregate";
import { MotionService } from "../Services/MotionService";
import { MotionProperties } from "../Types/MotionTypes";

export class MotionAPI {
    private service = new MotionService();

    public CreateMotion(
        motionProperties: MotionProperties,
        ownerId?: string,
        motionName?: string,
    ): MotionAggregate {
        return this.service.CreateMotion(motionProperties, ownerId, motionName);
    }

    public GetActorMotion(ownerId: string, motionName?: string): MotionAggregate | undefined {
        return this.service.GetActorMotion(ownerId, motionName);
    }

    public GetActorMotions(ownerId: string): Map<string, MotionAggregate> | undefined {
        return this.service.GetActorMotions(ownerId);
    }

    public HasActorMotion(ownerId: string, motionName?: string): boolean {
        return this.service.HasActorMotion(ownerId, motionName);
    }

    public RemoveActorMotion(ownerId: string, motionName?: string): boolean {
        return this.service.RemoveActorMotion(ownerId, motionName);
    }

    public RemoveActorMotions(ownerId: string): boolean {
        return this.service.RemoveActorMotions(ownerId);
    }
}
