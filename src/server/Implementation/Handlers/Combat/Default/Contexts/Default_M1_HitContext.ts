import { PhaseResolverContext } from "shared/Domain/PhaseResolver/Types/PhaseResolverTypes";

export interface Default_M1_HitContext extends PhaseResolverContext {
    damage: number;
    ownerId: string;
    targetId: string;
    currentClick: number;
    tags: string[];
}
