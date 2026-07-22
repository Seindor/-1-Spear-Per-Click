import { Workspace, RunService } from "@rbxts/services";
import {
    AbilityEvent,
    IAbility,
    IAbilityBehaviour,
    IAbilityBlacklist,
    IAbilityConfig,
    IAbilityStates,
    IStatusId,
} from "../Types/AbilityTypes";

import { Janitor } from "@rbxts/janitor";
import { TableHelper } from "shared/Utilities/TableHelper";
import { ArrayHelper } from "shared/Utilities/ArrayHelper";

export class AbilityAggregate implements IAbility {
    readonly config: IAbilityConfig;
    readonly behaviours: IAbilityBehaviour;

    public _janitor = new Janitor<any>();
    public destroyed = false;
    private ending = false;

    private listeners = new Map<AbilityEvent, Set<(ability: AbilityAggregate) => void>>();

    constructor(_config: IAbilityConfig, _behaviours: IAbilityBehaviour) {
        this.config = _config;
        this.behaviours = _behaviours;
    }

    public SubscribeEvent(event: AbilityEvent, cb: (ability: AbilityAggregate) => void) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(cb);
    }

    public UnsubscribeEvent(event: AbilityEvent, cb: (ability: AbilityAggregate) => void) {
        this.listeners.get(event)?.delete(cb);
    }

    private Emit(event: AbilityEvent) {
        const set = this.listeners.get(event);
        if (!set) return;

        for (const cb of set) {
            task.spawn(() => cb(this));
        }
    }

    private validateDuration(check: boolean) {
        if (this.destroyed) return;
        if (TableHelper.IsTableEmpty(this)) return;

        this._janitor.Remove("validateDuration");

        if (this.config.manualEnd) return;
        if (this.config.duration === math.huge) return;

        if (this.config.duration === 0 && this.config.minDuration === 0) {
            this.Execute("End", check);
            return;
        }

        const connection = RunService.Heartbeat.Connect(() => {
            if (!this.HasState("Active")) {
                this._janitor.Remove("validateDuration");
                return;
            }

            const now = Workspace.GetServerTimeNow();
            const elapsed = now - this.config.lastUsed;

            if (elapsed >= this.config.duration) {
                this.Execute("End", check);
            }
        });

        this._janitor.Add(connection, "Disconnect", "validateDuration");
    }

    private validateCooldown() {
        if (this.destroyed) return;
        if (TableHelper.IsTableEmpty(this)) return;

        this._janitor.Remove("validateCooldown");

        const connection = RunService.Heartbeat.Connect(() => {
            if (!this.OnCooldown()) {
                this.RemoveState("Cooldown");
                this.AddState("Idle");

                this.Emit("CooldownEnded");

                this._janitor.Remove("validateCooldown");
            }
        });

        this._janitor.Add(connection, "Disconnect", "validateCooldown");
    }

    private canStart(check: boolean): boolean {
        if (TableHelper.IsTableEmpty(this)) return false;
        if (this.destroyed) return false;
        if (!check) return true;
        if (this.HasState("Locked")) return false;
        if (this.HasState("Active")) return false;
        if (this.HasState("Cooldown")) return false;
        if (this.OnCooldown()) return false;
        return true;
    }

    private canEnd(check: boolean): boolean {
        if (TableHelper.IsTableEmpty(this)) return false;
        if (!this.HasState("Active")) return false;
        if (this.ending) return false;
        return true;
    }

    public AddState(state: IAbilityStates) {
        if (TableHelper.IsTableEmpty(this)) return;
        ArrayHelper.addString(this.config.states, state, true);
    }

    public RemoveState(state: IAbilityStates) {
        if (TableHelper.IsTableEmpty(this)) return;
        if (!this || !this.config || !this.config.states) return;

        ArrayHelper.removeString(this.config.states, state, true);
    }

    public HasState(state: IAbilityStates) {
        if (TableHelper.IsTableEmpty(this)) return false;
        return ArrayHelper.has(this.config.states, state);
    }

    public AddTag(tag: string) {
        if (TableHelper.IsTableEmpty(this)) return;
        if (!this.config.tags) this.config.tags = [];
        if (!this.config.tags.includes(tag)) this.config.tags.push(tag);
    }

    public RemoveTag(tag: string) {
        if (TableHelper.IsTableEmpty(this)) return;
        if (!this.config.tags) return;
        const index = this.config.tags.indexOf(tag);
        if (index !== -1) this.config.tags.remove(index);
    }

    public HasTag(tag: string): boolean {
        if (TableHelper.IsTableEmpty(this)) return false;
        return this.config.tags?.includes(tag) ?? false;
    }

    public GetTags(): string[] {
        if (this.destroyed) return [];
        if (TableHelper.IsTableEmpty(this)) return [];
        return this.config.tags ?? [];
    }

    public GetBlacklist(): IStatusId[] {
        if (this.destroyed) return [];
        if (TableHelper.IsTableEmpty(this)) return [];
        const global = IAbilityBlacklist;
        const additional = this.config.additionalBlacklist ?? [];
        return [...global, ...additional];
    }

    public Execute(callBackName: "Start" | "End", check: boolean, ...args: unknown[]) {
        if (this.destroyed) return;
        if (TableHelper.IsTableEmpty(this)) return;

        if (callBackName === "Start") {
            if (!this.canStart(check)) {
                this.Emit("Rejected");
                this.RemoveState("Active");
                this._janitor.Add(
                    task.spawn(() => this.behaviours.onReject?.(...args)),
                    true,
                );
                return;
            }

            if (check && this.behaviours.onStartCheck(...args) !== true) {
                this.Emit("Rejected");
                this.RemoveState("Active");
                this._janitor.Add(
                    task.spawn(() => this.behaviours.onReject?.(...args)),
                    true,
                );
                return;
            }

            this.RemoveState("Idle");

            this.config.lastUsed = Workspace.GetServerTimeNow();

            this.AddState("Active");
            this.ending = false;

            this.Emit("Started");

            this._janitor.Add(
                task.spawn(() => this.behaviours.onStart(...args)),
                true,
            );

            this.validateDuration(check);
            return;
        }

        if (!this.canEnd(check)) return;
        if (check === true && this.behaviours.onEndCheck(...args) !== true) return;

        this.ending = true;

        this.RemoveState("Active");
        this.RemoveState("Holding");

        this.AddState("Cooldown");

        this.Emit("Ended");
        this.Emit("CooldownStarted");

        this._janitor.Add(
            task.spawn(() => this.behaviours.onEnd(...args)),
            true,
        );

        this.validateCooldown();

        task.defer(() => {
            this.ending = false;
        });
    }

    public Interrupt(...args: unknown[]) {
        if (this.destroyed) return;
        if (TableHelper.IsTableEmpty(this)) return;

        this.RemoveState("Active");
        this.RemoveState("Holding");

        this.Emit("Interrupted");

        this._janitor.Add(task.spawn(() => this.behaviours.onInterrupt(...args)));
    }

    public Reject(...args: unknown[]) {
        if (this.destroyed) return;
        if (TableHelper.IsTableEmpty(this)) return;

        this.Emit("Rejected");
        this.behaviours.onReject?.(...args);
    }

    public IsActive() {
        return this.HasState("Active");
    }

    public OnCooldown(): boolean {
        if (TableHelper.IsTableEmpty(this)) return true;
        const now = Workspace.GetServerTimeNow();
        if (this.config.cooldown === 0) return false;
        return now - this.config.lastUsed <= this.config.cooldown;
    }

    public Destroy() {
        this.destroyed = true;
        this.listeners.clear();
        this._janitor.Cleanup();
        TableHelper.ClearTable(this);
    }
}
