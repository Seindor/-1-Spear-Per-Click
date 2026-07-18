import { HitboxAggregate } from "../Aggregates/HitboxAggregate";
import { HitboxService } from "../Services/HitboxService";
import { HitboxConfig } from "../Types/HitboxTypes";

export class HitboxAPI {
    private service = new HitboxService();

    // rewindTime = Workspace.GetServerTimeNow() на сервере - clientTimestamp присланный клиентом
    public Create(
        id: string,
        owner: BasePart | Model | undefined,
        config: HitboxConfig,
        rewindTime?: number,
    ): HitboxAggregate {
        return this.service.Create(id, owner, config, rewindTime);
    }

    public Get(id: string): HitboxAggregate | undefined {
        return this.service.Get(id);
    }

    public Destroy(id: string) {
        this.service.Destroy(id);
    }

    public TrackModel(model: Model) {
        this.service.TrackModel(model);
    }

    public UntrackModel(model: Model) {
        this.service.UntrackModel(model);
    }

    public IsTracked(model: Model): boolean {
        return this.service.IsTracked(model);
    }
}
