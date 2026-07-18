import { EntityStorageAggregate } from "../Aggregates/EntityStorageAggregate";

export class EntitiesStorageService {
    public Entities = new Map<string, EntityStorageAggregate>();

    public AddEntity(entityId: string, entity: unknown): EntityStorageAggregate {
        if (this.Entities.has(entityId)) {
            if (this.Entities.get(entityId)!.entity === entity) {
                return this.Entities.get(entityId)!;
            } else {
                this.Entities.delete(entityId);
            }
        }

        let entityStorageAggregate = new EntityStorageAggregate(entity, entityId);
        this.Entities.set(entityId, entityStorageAggregate);

        return entityStorageAggregate;
    }

    public GetEntity(idOrEntity: string | Instance): EntityStorageAggregate | undefined {
        if (typeIs(idOrEntity, "string")) {
            return this.Entities.get(idOrEntity);
        }

        for (const [_, aggregate] of this.Entities) {
            if (aggregate.entity === idOrEntity) {
                return aggregate;
            }
        }

        return undefined;
    }

    public GetEntities(): Map<string, EntityStorageAggregate> {
        return this.Entities;
    }

    public RemoveEntity(entityId: string) {
        if (!this.Entities.has(entityId)) {
            return;
        }

        this.Entities.delete(entityId);
    }
}
