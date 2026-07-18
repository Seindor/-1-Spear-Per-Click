import { AbilityAggregate } from "shared/Domain/Ability/Aggregates/AbilityAggregate";
import { PhaseResolverContext } from "shared/Domain/PhaseResolver/Types/PhaseResolverTypes";

export interface Default_HitContext extends PhaseResolverContext {
    damage: {
        health?: number;
        posture?: number;
    } & { [key: string]: number | undefined };
    ownerId: string;
    ability: AbilityAggregate;
    targetId: string;
    tags: string[];
    miscData: Map<string, unknown>;
}
