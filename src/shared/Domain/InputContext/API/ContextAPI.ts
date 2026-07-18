// ─────────────────────────────────────────────
//  InputContext / API / ContextAPI.ts
// ─────────────────────────────────────────────

import { ContextAggregate } from "../Aggregates/ContextAggregate";
import { ContextService } from "../Services/ContextService";
import { ContextProperties } from "../Types/ContextTypes";

export class ContextAPI {
    private service = new ContextService();

    public CreateGroup(groupName: string, overwrite = false) {
        this.service.CreateGroup(groupName, overwrite);
    }

    public RemoveGroup(groupName: string) {
        this.service.RemoveGroup(groupName);
    }

    public GetActionName(groupName: string, contextName: string): string {
        return this.service.GetActionName(groupName, contextName);
    }

    public HasGroup(groupName: string): boolean {
        return this.service.HasGroup(groupName);
    }

    public HasContext(groupName: string, contextName: string): boolean {
        return this.service.HasContext(groupName, contextName);
    }

    public GetContext(groupName: string, contextName: string): ContextAggregate | undefined {
        return this.service.GetContext(groupName, contextName);
    }

    public BindAction(
        groupName: string,
        contextProperties: ContextProperties,
        overwrite = false,
    ): ContextAggregate {
        return this.service.BindAction(groupName, contextProperties, overwrite);
    }

    public BindActionAtPriority(
        groupName: string,
        contextProperties: ContextProperties,
        overwrite = false,
    ): ContextAggregate {
        return this.service.BindActionAtPriority(groupName, contextProperties, overwrite);
    }

    public UnbindAction(groupName: string, contextName: string) {
        this.service.UnbindAction(groupName, contextName);
    }

    public UnbindAllGroupActions(groupName: string) {
        this.service.UnbindAllGroupActions(groupName);
    }

    public UnbindAll() {
        this.service.UnbindAll();
    }

    public RefreshBoundInfo(groupName: string, contextName: string) {
        return this.service.RefreshBoundInfo(groupName, contextName);
    }

    // ── enable / disable группы ──────────────────────────────────────────────

    public SetGroupEnabled(groupName: string, enabled: boolean): void {
        this.service.SetGroupEnabled(groupName, enabled);
    }

    public IsGroupEnabled(groupName: string): boolean {
        return this.service.IsGroupEnabled(groupName);
    }

    // ── слои блокировки ──────────────────────────────────────────────────────

    public PushLayer(name: string, disabledGroups: readonly string[]): void {
        this.service.PushLayer(name, disabledGroups);
    }

    public PopLayer(name: string): void {
        this.service.PopLayer(name);
    }
}
