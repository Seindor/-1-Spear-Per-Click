import { RunService, Workspace } from "@rbxts/services";
import {
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

export class AbilityAggregateOld implements IAbility {
    readonly config: IAbilityConfig;
    readonly behaviours: IAbilityBehaviour;

    public _janitor = new Janitor<any>();

    public destroyed = false as boolean;
    private ending = false;

    constructor(_config: IAbilityConfig, _behaviours: IAbilityBehaviour) {
        this.config = _config;
        this.behaviours = _behaviours;
    }

    private validateDuration(check: boolean) {
        if (this.destroyed) return;
        if (TableHelper.IsTableEmpty(this)) return;

        this._janitor.Remove("validateDuration");

        if (this.config.manualEnd) return;
        if (this.config.duration === math.huge) return;

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
        if (TableHelper.IsTableEmpty(this)) return;
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
                this._janitor.Add(
                    task.spawn(() => {
                        this.behaviours.onReject?.(...args);
                    }),
                    true,
                );
                return;
            }

            if (check && this.behaviours.onStartCheck(...args) !== true) {
                this._janitor.Add(
                    task.spawn(() => {
                        this.behaviours.onReject?.(...args);
                    }),
                    true,
                );
                return;
            }

            this.RemoveState("Idle");

            this.config.lastUsed = Workspace.GetServerTimeNow();

            this.AddState("Active");
            this.ending = false;

            this._janitor.Add(
                task.spawn(() => {
                    this.behaviours.onStart(...args);
                }),
                true,
            );

            this.validateDuration(check);
            return;
        }

        if (!this.canEnd(check)) return;

        if (check && this.behaviours.onEndCheck(...args) !== true) return;

        this.ending = true;

        this.RemoveState("Active");
        this.RemoveState("Holding");

        this.AddState("Cooldown");

        this._janitor.Add(
            task.spawn(() => {
                this.behaviours.onEnd(...args);
            }),
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

        // if (!this.HasState("Active")) {
        //     print("RETURNRR");
        //     return;
        // }

        this.RemoveState("Active");
        this.RemoveState("Holding");

        this._janitor.Add(
            task.spawn(() => {
                this.behaviours.onInterrupt(...args);
            }),
        );
    }

    public Reject(...args: unknown[]) {
        if (this.destroyed) return;
        if (TableHelper.IsTableEmpty(this)) return;

        this.behaviours.onReject?.(...args);
    }

    public IsActive() {
        return this.HasState("Active");
    }

    public OnCooldown(): boolean {
        if (TableHelper.IsTableEmpty(this)) return true;
        const now = Workspace.GetServerTimeNow();
        return now - this.config.lastUsed <= this.config.cooldown;
    }

    public Destroy() {
        this.destroyed = true;
        this._janitor.Cleanup();
        TableHelper.ClearTable(this);
    }
}
