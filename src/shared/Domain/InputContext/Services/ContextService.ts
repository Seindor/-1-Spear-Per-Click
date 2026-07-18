// ─────────────────────────────────────────────
//  InputContext / Services / ContextService.ts
// ─────────────────────────────────────────────

import { ContextActionService } from "@rbxts/services";
import { ContextAggregate } from "../Aggregates/ContextAggregate";
import { ContextProperties } from "../Types/ContextTypes";
import { TableHelper } from "shared/Utilities/TableHelper";

interface InputLayer {
    readonly name: string;
    readonly disabledGroups: readonly string[];
}

export class ContextService {
    public contexts = new Map<string, Map<string, ContextAggregate>>();

    /** Стек активных "слоёв блокировки" — см. PushLayer/PopLayer ниже */
    private readonly layers: InputLayer[] = [];

    public CreateGroup(groupName: string, overwrite = false) {
        if (this.contexts.has(groupName)) {
            warn(`${groupName} already exists on contexts, overwrite is: ${overwrite}`);

            if (!overwrite) {
                return;
            }

            this.UnbindAllGroupActions(groupName);
            this.contexts.delete(groupName);
        }

        this.contexts.set(groupName, new Map<string, ContextAggregate>());
    }

    public RemoveGroup(groupName: string) {
        const group = this.contexts.get(groupName);
        if (!group) {
            warn(`Cannot find ${groupName} in contexts.`);
            return;
        }

        this.UnbindAllGroupActions(groupName);

        this.contexts.delete(groupName);
    }

    public GetActionName(groupName: string, contextName: string): string {
        return `${groupName}_${contextName}`;
    }

    public HasGroup(groupName: string): boolean {
        return this.contexts.has(groupName);
    }

    public HasContext(groupName: string, contextName: string): boolean {
        const group = this.contexts.get(groupName);
        if (!group) {
            return false;
        }

        return group.has(contextName);
    }

    public GetContext(groupName: string, contextName: string): ContextAggregate | undefined {
        const group = this.contexts.get(groupName);
        if (!group) {
            warn(`Cannot find ${groupName} in contexts.`);
            return undefined;
        }

        const context = group.get(contextName);
        if (!context) {
            warn(`Cannot get ${contextName} from ${groupName}`);
            return undefined;
        }

        return context;
    }

    private UpdateBoundInfo(context: ContextAggregate, actionName: string) {
        const info = ContextActionService.GetBoundActionInfo(actionName);
        context.context = "createTouchButton" in info ? (info as BoundActionInfo) : {};
    }

    public BindAction(
        groupName: string,
        contextProperties: ContextProperties,
        overwrite = false,
    ): ContextAggregate {
        let group = this.contexts.get(groupName);

        if (!group) {
            this.CreateGroup(groupName, overwrite);
            group = this.contexts.get(groupName)!;
        }

        const contextName = contextProperties.name;

        if (group.has(contextName)) {
            warn(`${contextName} already exists in ${groupName}, overwrite is: ${overwrite}`);

            if (!overwrite) {
                return group.get(contextName)!;
            }

            this.UnbindAction(groupName, contextName);
        }

        const context = new ContextAggregate(contextProperties);
        const actionName = this.GetActionName(groupName, contextName);

        ContextActionService.BindAction(
            actionName,
            context.bind,
            context.createTouchButton,
            ...context.inputTypes,
        );

        context.context = ContextActionService.GetBoundActionInfo(actionName);

        this.UpdateBoundInfo(context, actionName);

        group.set(contextName, context);
        context.OnSpawned();

        // Новосозданный контекст сразу подчиняется активным слоям блокировки
        context.SetEnabled(this.IsGroupEnabled(groupName));

        return context;
    }

    public BindActionAtPriority(
        groupName: string,
        contextProperties: ContextProperties,
        overwrite = false,
    ): ContextAggregate {
        let group = this.contexts.get(groupName);

        if (!group) {
            this.CreateGroup(groupName, overwrite);
            group = this.contexts.get(groupName)!;
        }

        const contextName = contextProperties.name;

        if (group.has(contextName)) {
            warn(`${contextName} already exists in ${groupName}, overwrite is: ${overwrite}`);

            if (!overwrite) {
                return group.get(contextName)!;
            }

            this.UnbindAction(groupName, contextName);
        }

        const context = new ContextAggregate(contextProperties);
        const actionName = this.GetActionName(groupName, contextName);
        const priority = context.priority ?? 0;

        ContextActionService.BindActionAtPriority(
            actionName,
            context.bind,
            context.createTouchButton,
            priority,
            ...context.inputTypes,
        );

        context.context = ContextActionService.GetBoundActionInfo(actionName);

        this.UpdateBoundInfo(context, actionName);

        group.set(contextName, context);
        context.OnSpawned();

        context.SetEnabled(this.IsGroupEnabled(groupName));

        return context;
    }

    public UnbindAction(groupName: string, contextName: string) {
        const group = this.contexts.get(groupName);
        if (!group) {
            warn(`Cannot find ${groupName} in contexts.`);
            return;
        }

        const context = group.get(contextName);
        if (!context) {
            warn(`Cannot get ${contextName} from ${groupName}`);
            return;
        }

        const actionName = this.GetActionName(groupName, contextName);

        context.OnRemoved();
        ContextActionService.UnbindAction(actionName);
        context.context = {};

        TableHelper.ClearTable(context);
        group.delete(contextName);

        if (group.size() === 0) {
            this.contexts.delete(groupName);
        }
    }

    public UnbindAllGroupActions(groupName: string) {
        const group = this.contexts.get(groupName);
        if (!group) {
            warn(`Cannot find ${groupName} in contexts.`);
            return;
        }

        const contextNames = new Array<string>();
        for (const [contextName] of group) {
            contextNames.push(contextName);
        }

        for (const contextName of contextNames) {
            this.UnbindAction(groupName, contextName);
        }
    }

    public UnbindAll() {
        const groupNames = new Array<string>();

        for (const [groupName] of this.contexts) {
            groupNames.push(groupName);
        }

        for (const groupName of groupNames) {
            this.UnbindAllGroupActions(groupName);
        }
    }

    public RefreshBoundInfo(groupName: string, contextName: string) {
        const context = this.GetContext(groupName, contextName);
        if (!context) {
            return undefined;
        }

        const actionName = this.GetActionName(groupName, contextName);
        this.UpdateBoundInfo(context, actionName);

        return context.context;
    }

    // ── enable / disable группы ──────────────────────────────────────────────

    public SetGroupEnabled(groupName: string, enabled: boolean): void {
        const group = this.contexts.get(groupName);
        if (!group) return;

        for (const [, context] of group) {
            context.SetEnabled(enabled);
        }
    }

    public IsGroupEnabled(groupName: string): boolean {
        const group = this.contexts.get(groupName);
        if (!group) return true;

        for (const [, context] of group) {
            return context.IsEnabled();
        }

        return true;
    }

    // ── слои блокировки ──────────────────────────────────────────────────────

    /**
     * Кладёт на стек слой, отключающий перечисленные группы.
     * Если положить несколько слоёв — итоговое состояние это ОБЪЕДИНЕНИЕ
     * всех disabledGroups по всем активным слоям (снять один слой не включит
     * группу обратно, если её всё ещё держит другой слой).
     *
     * @example
     * ```ts
     * // Открыли диалог с NPC — хотбар и главные инпуты глохнут,
     * // а группа "Dialogue" (кнопки 1-5 для выбора реплики) остаётся живой
     * contextsAPI.PushLayer("Dialogue", ["Hotbar", "MainInput"]);
     * ```
     */
    public PushLayer(name: string, disabledGroups: readonly string[]): void {
        this.layers.push({ name, disabledGroups });
        this.RecomputeLayers();
    }

    public PopLayer(name: string): void {
        const index = this.layers.findIndex((l) => l.name === name);
        if (index === -1) return;

        this.layers.remove(index);
        this.RecomputeLayers();
    }

    private RecomputeLayers(): void {
        const disabled = new Set<string>();

        for (const layer of this.layers) {
            for (const groupName of layer.disabledGroups) {
                disabled.add(groupName);
            }
        }

        for (const [groupName] of this.contexts) {
            this.SetGroupEnabled(groupName, !disabled.has(groupName));
        }
    }
}
