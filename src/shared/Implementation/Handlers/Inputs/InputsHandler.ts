import type { ContextAPI } from "shared/Domain/InputContext/API/ContextAPI";
import { KeybindMapper } from "./KeybindMapper";

import type EventBusAggregate from "shared/Domain/EventBus/Aggregates/EventBusAggregate";
import type { IKeybinds, IRuntimeBind } from "shared/Types/Database/Keybinds";

export class InputsHandler {
    constructor(
        private readonly contextsAPI: ContextAPI,
        private readonly inputsBus: EventBusAggregate,
    ) {}

    public ResolveKeybinds(
        saved: IKeybinds,
        defaults: Record<string, IRuntimeBind>,
    ): Record<string, IRuntimeBind> {
        return KeybindMapper.MergeWithDefaults(saved, defaults);
    }

    public BindGroup(
        groupName: string,
        priority: number,
        binds: Record<string, IRuntimeBind>,
    ): void {
        for (const [actionName, bind] of pairs(binds)) {
            this.contextsAPI.BindActionAtPriority(
                groupName,
                {
                    name: actionName as string,
                    bind: (_actionName, inputState, inputObject) => {
                        if (inputState === Enum.UserInputState.Cancel) {
                            return Enum.ContextActionResult.Pass;
                        }

                        this.inputsBus.FireSync(
                            `InputPressed`,
                            1,
                            undefined,
                            actionName as string,
                            inputState,
                            inputObject,
                            groupName,
                        );

                        return Enum.ContextActionResult.Pass;
                    },
                    createTouchButton: false,
                    inputTypes: bind.inputTypes,
                    combo: bind.combo,
                    priority,
                },
                true,
            );
        }
    }

    public UnbindGroup(groupName: string): void {
        this.contextsAPI.UnbindAllGroupActions(groupName);
    }

    public PushBlockingLayer(layerName: string, disabledGroups: readonly string[]): void {
        this.contextsAPI.PushLayer(layerName, disabledGroups);
    }

    public PopBlockingLayer(layerName: string): void {
        this.contextsAPI.PopLayer(layerName);
    }
}
