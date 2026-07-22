import { RunService, Workspace } from "@rbxts/services";
import { Janitor } from "@rbxts/janitor";

import { HitboxAggregate } from "../Aggregates/HitboxAggregate";
import { HitboxConfig } from "../Types/HitboxTypes";
import { HitboxVisualizer } from "../Components/HitboxVisualizer";
import { OBB, OBBOverlap } from "../Components/OBBintersection";

type Snapshot = {
    time: number; // Workspace.GetServerTimeNow()
    cframe: CFrame;
    velocity: Vector3;
};

type TrackedPartInfo = {
    // Насколько секунд назад можно откатить позицию ЭТОГО конкретного парта.
    // Задаётся индивидуально в TrackPart — например для боссов можно
    // хранить дольше, чем для рядовых мобов.
    saveTime: number;
};

export class HitboxService {
    private hitboxes = new Map<string, HitboxAggregate>();

    // Трекнутые парты: часть -> её персональная настройка (saveTime).
    private trackedParts = new Map<BasePart, TrackedPartInfo>();
    private history = new Map<BasePart, Snapshot[]>();

    private lastCFrame = new Map<string, CFrame>();
    private activeHits = new Map<string, Set<BasePart>>();

    private janitor = new Janitor<any>();

    // Троттлинг записи снапшотов — не на КАЖДЫЙ физический кадр (это дорого
    // при большом числе трекнутых партов), а раз в snapshotInterval секунд.
    // 0.05 (20 Гц) — хороший баланс точности/нагрузки по умолчанию.
    // Если партов много и профайлер показывает нагрузку — подними до 0.1 (10 Гц).
    private readonly snapshotInterval: number;
    private lastSnapshotAt = 0;

    constructor(snapshotInterval = 0.05) {
        this.snapshotInterval = snapshotInterval;

        this.janitor.Add(
            RunService.PostSimulation.Connect((dt) => {
                this.record();
                this.update(dt);
            }),
        );
    }

    /**
     * Начинает отслеживать позицию part для использования в предикшене.
     * saveTime — на сколько секунд назад можно откатить его позицию при
     * проверке хитбокса (по умолчанию 2 секунды). Повторный вызов на уже
     * трекнутом part обновляет saveTime, история не сбрасывается.
     */
    public TrackPart(part: BasePart, saveTime = 2): void {
        this.trackedParts.set(part, { saveTime });
    }

    public UntrackPart(part: BasePart): void {
        this.trackedParts.delete(part);
        this.history.delete(part);
    }

    public IsTracked(part: BasePart): boolean {
        return this.trackedParts.has(part);
    }

    // rewindTime — латентность клиента: serverNow - clientTimestamp
    public Create(
        id: string,
        owner: BasePart | Model | undefined,
        config: HitboxConfig,
        rewindTime?: number,
    ): HitboxAggregate {
        // если prediction включён и rewindTime передан — применяем его
        if (config.prediction?.enabled && rewindTime !== undefined) {
            config = {
                ...config,
                prediction: {
                    ...config.prediction,
                    // Санитарный потолок на случай сломанного/читерского клиента —
                    // независимо от него, ниже дополнительно клэмпится под
                    // saveTime конкретного трекнутого парта.
                    rewindTime: math.clamp(rewindTime, 0, 0.4),
                },
            };
        }

        const hb = new HitboxAggregate(id, config, owner);
        this.hitboxes.set(id, hb);
        hb.Enable();

        this.lastCFrame.set(id, this.getWorldCFrame(hb));
        this.activeHits.set(id, new Set());

        return hb;
    }

    public Get(id: string): HitboxAggregate | undefined {
        return this.hitboxes.get(id);
    }

    public Destroy(id: string) {
        const hb = this.hitboxes.get(id);

        HitboxVisualizer.RemoveVisual(id);

        if (!hb) return;

        hb.Destroy();
        this.hitboxes.delete(id);
        this.lastCFrame.delete(id);
        this.activeHits.delete(id);
    }

    // Запись истории — троттлится snapshotInterval, читает CFrame напрямую
    // с трекнутого BasePart (больше не ищет HumanoidRootPart внутри Model).
    private record() {
        const now = Workspace.GetServerTimeNow();

        if (now - this.lastSnapshotAt < this.snapshotInterval) return;
        this.lastSnapshotAt = now;

        for (const [part, info] of this.trackedParts) {
            if (!part.Parent) continue;

            let list = this.history.get(part);
            if (!list) {
                list = [];
                this.history.set(part, list);
            }

            list.push({
                time: now,
                cframe: part.CFrame,
                velocity: part.AssemblyLinearVelocity,
            });

            // чистим снапшоты старше saveTime ИМЕННО этого парта
            while (list.size() > 0 && now - list[0].time > info.saveTime) {
                list.remove(0);
            }
        }
    }

    private update(dt: number) {
        for (const [id, hb] of this.hitboxes) {
            if (!hb.active) continue;
            hb.Step(dt);
            this.process(id, hb);
        }
    }

    private getWorldCFrame(hb: HitboxAggregate): CFrame {
        const owner = hb.owner;
        let base = new CFrame();

        if (owner) {
            base = owner.IsA("BasePart") ? owner.CFrame : owner.GetPivot();
        }

        return base.mul(hb.config.offset ?? new CFrame());
    }

    // Возвращает интерполированный CFrame парта в момент времени targetTime.
    private getHistoricalCFrame(part: BasePart, targetTime: number): CFrame | undefined {
        const snapshots = this.history.get(part);
        if (!snapshots || snapshots.size() < 2) return undefined;

        for (let i = snapshots.size() - 2; i >= 0; i--) {
            const older = snapshots[i];
            const newer = snapshots[i + 1];

            if (targetTime >= older.time && targetTime <= newer.time) {
                const delta = newer.time - older.time;
                if (delta <= 0) return older.cframe;

                const alpha = math.clamp((targetTime - older.time) / delta, 0, 1);
                return older.cframe.Lerp(newer.cframe, alpha);
            }
        }

        if (targetTime < snapshots[0].time) {
            return snapshots[0].cframe;
        }

        return snapshots[snapshots.size() - 1].cframe;
    }

    // Проверка фильтра (Exclude/Include + FilterDescendantsInstances) для
    // партов из this.trackedParts — они НЕ проходят через
    // Workspace:GetPartBoundsInBox, поэтому фильтр нужно применять вручную.
    private passesInstanceFilter(part: BasePart, cfg: HitboxConfig): boolean {
        const filterList = cfg.filter;
        const isExclude =
            (cfg.filterType ?? Enum.RaycastFilterType.Exclude) === Enum.RaycastFilterType.Exclude;

        if (!filterList || filterList.size() === 0) {
            return isExclude; // Exclude+пусто -> всё проходит; Include+пусто -> ничего
        }

        let matchesFilter = false;
        for (const inst of filterList) {
            if (part === inst || part.IsDescendantOf(inst)) {
                matchesFilter = true;
                break;
            }
        }

        return isExclude ? !matchesFilter : matchesFilter;
    }

    private process(id: string, hb: HitboxAggregate) {
        const cfg = hb.config;
        const prediction = cfg.prediction;
        const now = Workspace.GetServerTimeNow();

        const currentCF = this.getWorldCFrame(hb);
        let attackCF = currentCF;

        // leadTime — двигаем атакующего вперёд по его velocity
        if (prediction?.enabled && prediction.leadTime !== undefined && prediction.leadTime > 0) {
            const root = hb.owner?.IsA("BasePart")
                ? (hb.owner as BasePart)
                : ((hb.owner as Model | undefined)?.FindFirstChild("HumanoidRootPart") as
                      | BasePart
                      | undefined);

            if (root) {
                const velocity = root.AssemblyLinearVelocity;
                const offset = velocity.mul(prediction.leadTime);
                attackCF = new CFrame(currentCF.Position.add(offset)).mul(
                    currentCF.sub(currentCF.Position),
                );
            }
        }

        const lastCF = this.lastCFrame.get(id) ?? currentCF;
        this.lastCFrame.set(id, attackCF);

        // sweep между прошлым и текущим фреймом
        const sweepCF = lastCF.Lerp(attackCF, 0.5);

        const params = new OverlapParams();
        params.FilterType = cfg.filterType ?? Enum.RaycastFilterType.Exclude;
        params.FilterDescendantsInstances = cfg.filter ?? [];

        const currentFrameHits = new Set<BasePart>();
        const hitSet = this.activeHits.get(id)!;

        const registerHit = (part: BasePart) => {
            if (currentFrameHits.has(part)) return;
            if (cfg.hitCheck && !cfg.hitCheck(part)) return;

            currentFrameHits.add(part);

            if (!hb.CanHit(part)) return;

            task.spawn(() => cfg.onHit?.(part));
            hitSet.add(part);
        };

        // ── 1) ЖИВАЯ проверка: что реально пересекается прямо сейчас ──────
        const liveParts = Workspace.GetPartBoundsInBox(sweepCF, cfg.size, params);
        for (const part of liveParts) {
            registerHit(part);
        }

        // ── 2) ПРЕДИКШЕН: те же трекнутые парты, но по ЗАПИСАННОЙ позиции ──
        // Выполняется ОДНОВРЕМЕННО с живой проверкой (не вместо неё).
        // Если часть уже засчитана живой проверкой — пропускаем, чтобы не
        // делать лишнюю геометрию.
        if (prediction?.enabled && prediction.rewindTime !== undefined) {
            const hitboxOBB: OBB = { cframe: sweepCF, halfSize: cfg.size.mul(0.5) };

            for (const [part, info] of this.trackedParts) {
                if (!part.Parent) continue;
                if (currentFrameHits.has(part)) continue;
                if (!this.passesInstanceFilter(part, cfg)) continue;

                // Клэмп под ИСТОРИЮ конкретного парта — нельзя отмотать дальше,
                // чем для него реально сохранено.
                const clampedRewind = math.min(prediction.rewindTime, info.saveTime);
                const historicalCF = this.getHistoricalCFrame(part, now - clampedRewind);
                if (!historicalCF) continue;

                let halfSize = part.Size.mul(0.5);

                // movementForgiveness — расширяем хитбокс цели, если она быстро двигалась
                // (сглаживает погрешность интерполяции между снапшотами).
                if (
                    prediction.movementForgiveness !== undefined &&
                    prediction.movementForgiveness > 1
                ) {
                    const snapshots = this.history.get(part);
                    if (snapshots && snapshots.size() >= 2) {
                        const speed = snapshots[snapshots.size() - 1].velocity.Magnitude;
                        const scale = math.clamp(
                            1 + speed * 0.05,
                            1,
                            prediction.movementForgiveness,
                        );
                        halfSize = halfSize.mul(scale);
                    }
                }

                const targetOBB: OBB = { cframe: historicalCF, halfSize };
                if (!OBBOverlap(hitboxOBB, targetOBB)) continue;

                registerHit(part);
            }
        }

        // onHitEnd для целей, которые вышли из хитбокса (ни живой, ни исторической проверкой)
        for (const old of hitSet) {
            if (!currentFrameHits.has(old)) {
                task.spawn(() => cfg.onHitEnd?.(old));
                hitSet.delete(old);
            }
        }

        if (cfg.debug) {
            if (!this.hitboxes.has(id)) return;

            HitboxVisualizer.CreateVisual(
                id,
                sweepCF,
                cfg.size,
                cfg.shape ?? "Block",
                currentFrameHits.size() > 0,
            );
        }
    }
}
