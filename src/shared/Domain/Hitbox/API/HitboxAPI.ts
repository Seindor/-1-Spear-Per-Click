import { HitboxAggregate } from "../Aggregates/HitboxAggregate";
import { HitboxService } from "../Services/HitboxService";
import { HitboxConfig } from "../Types/HitboxTypes";

export class HitboxAPI {
    private service: HitboxService;

    /**
     * @param snapshotInterval Как часто (в секундах) записывается позиция
     * трекнутых партов для предикшена. По умолчанию 0.05 (20 Гц).
     * Подними до 0.1, если на сервере много трекнутых партов и профайлер
     * показывает нагрузку от записи истории.
     */
    constructor(snapshotInterval?: number) {
        this.service = new HitboxService(snapshotInterval);
    }

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

    /**
     * Начинает отслеживать позицию part для предикшена/rewind-проверки.
     * saveTime — на сколько секунд назад можно откатить его позицию
     * (по умолчанию 2 секунды).
     *
     * @example
     * hitboxAPI.TrackPart(humanoidRootPart); // saveTime = 2с по умолчанию
     * hitboxAPI.TrackPart(bossCorePart, 5);  // важной цели — история подольше
     */
    public TrackPart(part: BasePart, saveTime?: number): void {
        this.service.TrackPart(part, saveTime);
    }

    public UntrackPart(part: BasePart): void {
        this.service.UntrackPart(part);
    }

    public IsTracked(part: BasePart): boolean {
        return this.service.IsTracked(part);
    }
}
