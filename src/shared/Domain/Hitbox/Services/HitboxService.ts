import { RunService, Workspace } from "@rbxts/services";
import { Janitor } from "@rbxts/janitor";

import { HitboxAggregate } from "../Aggregates/HitboxAggregate";
import { HitboxConfig } from "../Types/HitboxTypes";
import { HitboxVisualizer } from "../Components/HitboxVisualizer";

type Snapshot = {
    time: number; // Workspace.GetServerTimeNow()
    cframe: CFrame;
    velocity: Vector3;
};

export class HitboxService {
    private hitboxes = new Map<string, HitboxAggregate>();
    private history = new Map<Model, Snapshot[]>();
    private trackedModels = new Set<Model>();

    private lastCFrame = new Map<string, CFrame>();
    private activeHits = new Map<string, Set<Instance>>();

    private janitor = new Janitor<any>();

    // максимальное время хранения истории в секундах
    private readonly HISTORY_DURATION = 1.0;

    constructor() {
        this.janitor.Add(
            RunService.PostSimulation.Connect((dt) => {
                this.record();
                this.update(dt);
            }),
        );
    }

    public TrackModel(model: Model) {
        if (this.trackedModels.has(model)) return;
        this.trackedModels.add(model);
    }

    public UntrackModel(model: Model) {
        this.trackedModels.delete(model);
        this.history.delete(model);
    }

    public IsTracked(model: Model): boolean {
        return this.trackedModels.has(model);
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

    // запись истории — используем GetServerTimeNow чтобы время совпадало с клиентом
    private record() {
        const now = Workspace.GetServerTimeNow();

        for (const model of this.trackedModels) {
            if (!model.Parent) continue;

            const root = model.FindFirstChild("HumanoidRootPart") as BasePart | undefined;
            if (!root) continue;

            let list = this.history.get(model);
            if (!list) {
                list = [];
                this.history.set(model, list);
            }

            list.push({
                time: now,
                cframe: root.CFrame,
                velocity: root.AssemblyLinearVelocity,
            });

            // чистим старые снапшоты
            while (list.size() > 0 && now - list[0].time > this.HISTORY_DURATION) {
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

    // возвращает интерполированный CFrame модели в момент времени targetTime
    private getHistoricalCFrame(model: Model, targetTime: number): CFrame | undefined {
        const snapshots = this.history.get(model);
        if (!snapshots || snapshots.size() < 2) return undefined;

        // ищем два снапшота между которыми находится targetTime
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

        // targetTime старше всех снапшотов — берём самый старый
        if (targetTime < snapshots[0].time) {
            return snapshots[0].cframe;
        }

        // targetTime новее всех — берём последний
        return snapshots[snapshots.size() - 1].cframe;
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

        const parts = Workspace.GetPartBoundsInBox(sweepCF, cfg.size, params);

        const currentFrameHits = new Set<Instance>();
        const hitSet = this.activeHits.get(id)!;

        for (const part of parts) {
            const target = part.FindFirstAncestorWhichIsA("Model") ?? part;

            if (cfg.hitCheck && !cfg.hitCheck(target)) continue;
            if (currentFrameHits.has(target)) continue;

            // rewind — откатываем цель назад и проверяем дистанцию
            if (prediction?.enabled && prediction.rewindTime !== undefined && target.IsA("Model")) {
                const targetTime = now - prediction.rewindTime;
                const historicalCF = this.getHistoricalCFrame(target, targetTime);

                if (historicalCF) {
                    let effectiveSize = cfg.size;

                    // movementForgiveness — расширяем хитбокс если цель двигалась
                    if (
                        prediction.movementForgiveness !== undefined &&
                        prediction.movementForgiveness > 1
                    ) {
                        const snapshots = this.history.get(target);
                        if (snapshots && snapshots.size() >= 2) {
                            const latest = snapshots[snapshots.size() - 1];
                            const speed = latest.velocity.Magnitude;
                            // чем быстрее цель, тем больше хитбокс, но не более чем forgiveness * size
                            const scale = math.clamp(
                                1 + speed * 0.05,
                                1,
                                prediction.movementForgiveness,
                            );
                            effectiveSize = cfg.size.mul(scale);
                        }
                    }

                    const distance = historicalCF.Position.sub(sweepCF.Position).Magnitude;
                    const tolerance = effectiveSize.Magnitude * 0.5;

                    if (distance > tolerance) continue;
                }
            }

            currentFrameHits.add(target);

            if (!hb.CanHit(target)) continue;

            task.spawn(() => cfg.onHit?.(target));
            hitSet.add(target);
        }

        // onHitEnd для целей которые вышли из хитбокса
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
