import { EntityStorageAggregate } from "../Aggregates/EntityStorageAggregate";
import { EntitiesStorageService } from "../Services/EntitiesStorageService";

export class EntitiesStorageAPI {
    private service = new EntitiesStorageService();

    public AddEntity(entityId: string, entity: any): EntityStorageAggregate {
        return this.service.AddEntity(entityId, entity);
    }

    public GetEntity(idOrEntity: string | Instance): EntityStorageAggregate | undefined {
        return this.service.GetEntity(idOrEntity);
    }

    public GetEntities(): Map<string, EntityStorageAggregate> {
        return this.service.GetEntities();
    }

    public RemoveEntity(entityId: string) {
        this.service.RemoveEntity(entityId);
    }
}
