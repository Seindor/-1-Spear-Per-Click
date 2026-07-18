import { Players } from "@rbxts/services";

import { PipelineContext } from "shared/Domain/Pipeline/Aggregates/PipelineContext";
import { PipelineStep } from "shared/Domain/Pipeline/Aggregates/PipelineStep";
import { Pipeline } from "shared/Domain/Pipeline/Decorators/Pipeline";

import {
    ClientPlayerContext,
    ClientPlayerPipelineToken,
} from "shared/Types/Pipelines/ClientsPlayer/ClientPlayerPipeline";

import type { ClientReplicatedAtomAPI } from "shared/Domain/ReplicatedAtoms/API/ClientReplicatedAtomAPI";
import type { PlayerData } from "shared/Types/Database/PlayerData";
import type { IRuntimeBind } from "shared/Types/Database/Keybinds";

import { ContextPriorities } from "shared/Types/Gameplay/ContextPriorities";
import {
    DefaultHotbarBinds,
    DefaultMainBinds,
} from "shared/Implementation/Entities/Templates/Gameplay/Keybinds";
import { LocalInputsHandler } from "shared/Implementation/Handlers/Inputs/LocalInputsHandler";

import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";
import { IsPlaceBlacklisted, PlaceBlacklist, PlaceIds } from "shared/Types/Game/ServerInfo";

const sharedScope = CompositionRootShared.createScope();

const clientReplicatedAtomAPI = sharedScope.resolve(
    SharedRegistry.Singletons.API.ClientAtomAPI,
) as ClientReplicatedAtomAPI;

const HotbarBinds: Record<string, IRuntimeBind> = {
    Hotbar1: { inputTypes: [Enum.KeyCode.One] },
    Hotbar2: { inputTypes: [Enum.KeyCode.Two] },
    Hotbar3: { inputTypes: [Enum.KeyCode.Three] },
    Hotbar4: { inputTypes: [Enum.KeyCode.Four] },
    Hotbar5: { inputTypes: [Enum.KeyCode.Five] },
    Hotbar6: { inputTypes: [Enum.KeyCode.Six] },
    Hotbar7: { inputTypes: [Enum.KeyCode.Seven] },
    Hotbar8: { inputTypes: [Enum.KeyCode.Eight] },
    Hotbar9: { inputTypes: [Enum.KeyCode.Nine] },
    Hotbar0: { inputTypes: [Enum.KeyCode.Zero] },
};

@Pipeline({ Pipeline: ClientPlayerPipelineToken })
export class SetupInputsStep extends PipelineStep<ClientPlayerContext> {
    public readonly Id = `SetupInputsStep`;

    public Blacklist = [`Main Menu`] as PlaceBlacklist;

    public Execute(ctx: PipelineContext<ClientPlayerContext>): void {
        if (IsPlaceBlacklisted(this.Blacklist)) {
            ctx.MarkFailed(this.Id);
            return;
        }

        const playerId = tostring(Players.LocalPlayer.UserId);

        clientReplicatedAtomAPI.WaitForChannel(`PlayerData`);

        const playerDataAtom =
            clientReplicatedAtomAPI.GetAtom<Record<string, PlayerData>>(`PlayerData`);
        const savedMainKeybinds = playerDataAtom?.()[playerId]?.settings.keybinds.MainInputs ?? {};
        const savedHotbarKeybinds = playerDataAtom?.()[playerId]?.settings.keybinds.HotBar ?? {};

        const mainBinds = LocalInputsHandler.ResolveKeybinds(savedMainKeybinds, DefaultMainBinds);
        const hotbarBinds = LocalInputsHandler.ResolveKeybinds(
            savedHotbarKeybinds,
            DefaultHotbarBinds,
        );

        LocalInputsHandler.BindGroup(`MainInput`, ContextPriorities.MainInput, mainBinds);
        LocalInputsHandler.BindGroup(`Hotbar`, ContextPriorities.Hotbar, HotbarBinds);

        ctx.MarkCompleted(this.Id);
    }
}
