import { PhaseResolverAggregate } from "../Aggregates/PhaseResolverAggregate";
import { PhaseResolverService } from "../Services/PhaseResolverService";
import { PhaseResolverContext, PhaseResolverProperties } from "../Types/PhaseResolverTypes";

export class PhaseResolverAPI {
    private service = new PhaseResolverService();

    public CreateResolver<TContext extends PhaseResolverContext>(
        properties: PhaseResolverProperties<TContext>,
        overwrite = false,
    ): PhaseResolverAggregate<TContext> {
        return this.service.CreateResolver(properties, overwrite);
    }

    public GetResolver<TContext extends PhaseResolverContext>(
        ownerId: string,
        resolverName: string,
    ): PhaseResolverAggregate<TContext> | undefined {
        return this.service.GetResolver(ownerId, resolverName);
    }

    public GetResolvers(ownerId: string): Map<string, PhaseResolverAggregate<any>> | undefined {
        return this.service.GetResolvers(ownerId);
    }

    public HasResolver(ownerId: string, resolverName: string): boolean {
        return this.service.HasResolver(ownerId, resolverName);
    }

    public RemoveResolver(ownerId: string, resolverName: string) {
        this.service.RemoveResolver(ownerId, resolverName);
    }

    public RemoveActor(ownerId: string) {
        this.service.RemoveActor(ownerId);
    }
}
