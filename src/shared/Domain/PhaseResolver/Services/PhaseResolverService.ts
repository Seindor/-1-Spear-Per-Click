import { PhaseResolverAggregate } from "../Aggregates/PhaseResolverAggregate";
import { PhaseResolverContext, PhaseResolverProperties } from "../Types/PhaseResolverTypes";

export class PhaseResolverService {
    private resolvers = new Map<string, Map<string, PhaseResolverAggregate<any>>>();

    private ensureActor(ownerId: string) {
        if (!this.resolvers.has(ownerId)) {
            this.resolvers.set(ownerId, new Map());
        }

        return this.resolvers.get(ownerId)!;
    }

    public CreateResolver<TContext extends PhaseResolverContext>(
        properties: PhaseResolverProperties<TContext>,
        overwrite = false,
    ): PhaseResolverAggregate<TContext> {
        const ownerResolvers = this.ensureActor(properties.ownerId);

        if (ownerResolvers.has(properties.resolverName)) {
            if (overwrite) {
                const existing = ownerResolvers.get(properties.resolverName)!;
                existing.Destroy();
                ownerResolvers.delete(properties.resolverName);
            } else {
                return ownerResolvers.get(
                    properties.resolverName,
                ) as PhaseResolverAggregate<TContext>;
            }
        }

        const resolver = new PhaseResolverAggregate<TContext>(properties);
        ownerResolvers.set(properties.resolverName, resolver);

        return resolver;
    }

    public GetResolver<TContext extends PhaseResolverContext>(
        ownerId: string,
        resolverName: string,
    ): PhaseResolverAggregate<TContext> | undefined {
        return this.resolvers.get(ownerId)?.get(resolverName) as
            | PhaseResolverAggregate<TContext>
            | undefined;
    }

    public GetResolvers(ownerId: string): Map<string, PhaseResolverAggregate<any>> | undefined {
        return this.resolvers.get(ownerId);
    }

    public HasResolver(ownerId: string, resolverName: string): boolean {
        return this.resolvers.get(ownerId)?.has(resolverName) ?? false;
    }

    public RemoveResolver(ownerId: string, resolverName: string) {
        const ownerResolvers = this.resolvers.get(ownerId);
        if (!ownerResolvers) {
            warn(`Cannot find ${ownerId} in PhaseResolver storage.`);
            return;
        }

        const resolver = ownerResolvers.get(resolverName);
        if (!resolver) {
            warn(`Cannot find resolver "${resolverName}" for ${ownerId}.`);
            return;
        }

        resolver.Destroy();
        ownerResolvers.delete(resolverName);

        if (ownerResolvers.size() === 0) {
            this.resolvers.delete(ownerId);
        }
    }

    public RemoveActor(ownerId: string) {
        const ownerResolvers = this.resolvers.get(ownerId);
        if (!ownerResolvers) {
            warn(`Cannot find ${ownerId} in PhaseResolver storage.`);
            return;
        }

        for (const [, resolver] of ownerResolvers) {
            resolver.Destroy();
        }

        this.resolvers.delete(ownerId);
    }
}
