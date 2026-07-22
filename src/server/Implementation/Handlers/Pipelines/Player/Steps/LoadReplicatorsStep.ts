import type { PipelineContext } from "shared/Domain/Pipeline/Aggregates/PipelineContext";
import { PlayerPipelineToken, type PlayerContext } from "../PlayerPipeline";
import { type SessionContext } from "shared/Types/Runtime/SessionRuntime";

import { DataHandler } from "server/Implementation/Handlers/Game/Data/DataHandler";
import type { RuntimeAPI } from "shared/Domain/Runtime/API/RuntimeAPI";
import type { ServerReplicatedAtomAPI } from "shared/Domain/ReplicatedAtoms/API/ServerReplicatedAtomAPI";

import { Pipeline } from "shared/Domain/Pipeline/Decorators/Pipeline";
import { PipelineStep } from "shared/Domain/Pipeline/Aggregates/PipelineStep";

import { RuntimeStatsState } from "shared/Types/Replicators/Runtime/RuntimeStatsState";

import { PlayerDataReplicator } from "server/Implementation/Handlers/Replicators/PlayerDataReplicator";
import { StatusEffectsReplicator } from "server/Implementation/Handlers/Replicators/StatusEffectsReplicator";
import { RuntimeEquipmentReplicator } from "server/Implementation/Handlers/Replicators/Runtime/RuntimeEquipmentReplicator";
import { RuntimeStatsReplicator } from "server/Implementation/Handlers/Replicators/Runtime/RuntimeStatsReplicator";
import { RuntimeGamePlayReplicator } from "server/Implementation/Handlers/Replicators/Runtime/RuntimeGamePlayReplicator";

import { ServerSignals } from "shared/Implementation/Entities/SerrverSignals";

import { CompositionRootShared } from "shared/DI/CompositionRootShared";
import { CompositionRootServer } from "server/DI/CompositionRootServer";
import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { ServerRegistry } from "server/DI/Generated/ServerRegistry";
import GameItemData from "shared/Utilities/GameHelpers/GameItemData";
import { IWeaponData } from "shared/Utilities/GameHelpers/GameItemData/Types/IWeaponData";
import { RuntimeSolversReplicator } from "server/Implementation/Handlers/Replicators/Runtime/RuntimeSolversReplicator";

const sharedScope = CompositionRootShared.createScope();
const serverScope = CompositionRootServer.createScope();

const runtimeAPI = sharedScope.resolve(
    SharedRegistry.Singletons.API.RuntimeAPI,
) as RuntimeAPI<SessionContext>;

const janitorAPI = sharedScope.resolve(SharedRegistry.Singletons.API.JanitorAPI);

const serverReplicatedAtomAPI = serverScope.resolve(
    ServerRegistry.Singletons.API.ServerAtomAPI,
) as ServerReplicatedAtomAPI;

@Pipeline({ Pipeline: PlayerPipelineToken })
export class LoadReplicatorsStep extends PipelineStep<PlayerContext> {
    public readonly Id = `LoadReplicatorsStep`;
    public readonly After = [`LoadDataStep`];

    public Execute(ctx: PipelineContext<PlayerContext>): void {
        const { id, player } = ctx.Data;
        const janitor = janitorAPI.Create(id, `LoadreplicatorsStep`);

        const dataHandler = ctx.Get(`DataHandler`) as DataHandler;
        const data = dataHandler.GetData();

        const entityWeapon = data.equipment.weapon;
        const weaponData = GameItemData.GetGameplayItemData<IWeaponData>(`Weapons`, entityWeapon);

        janitor.Add(
            ServerSignals.RequestHydrate.connect((player) => {
                serverReplicatedAtomAPI.Hydrate(player);
            }),
            `Disconnect`,
            `RequestHydrate`,
        );

        let playerDataReplicator = serverReplicatedAtomAPI.Get<PlayerDataReplicator>(`PlayerData`);

        playerDataReplicator?.InitActor(id, data);
        serverReplicatedAtomAPI.AddRecipient(`PlayerData`, id, player);

        let runtimeEquipmentReplicator =
            serverReplicatedAtomAPI.Get<RuntimeEquipmentReplicator>(`RuntimeEquipment`);

        runtimeEquipmentReplicator?.InitActor(id);
        serverReplicatedAtomAPI.AddRecipient(`RuntimeEquipment`, id, player);

        let runtimeStatsReplicator =
            serverReplicatedAtomAPI.Get<RuntimeStatsReplicator>(`RuntimeStats`);

        runtimeStatsReplicator?.InitActor(id, {
            stats: data.progression.stats,
            config: { strengthGainCooldown: weaponData.Cooldown },
        });
        serverReplicatedAtomAPI.AddRecipient(`RuntimeStats`, id, player);

        let runtimeGamePlayReplicator =
            serverReplicatedAtomAPI.Get<RuntimeGamePlayReplicator>(`RuntimeGamePlay`);
        runtimeGamePlayReplicator?.InitActor(id);
        serverReplicatedAtomAPI.AddRecipient(`RuntimeGamePlay`, id, player);

        let statusEffectsReplicator =
            serverReplicatedAtomAPI.Get<StatusEffectsReplicator>(`StatusEffects`);

        let runtimeSolversReplicator =
            serverReplicatedAtomAPI.Get<RuntimeSolversReplicator>(`RuntimeSolvers`);
        serverReplicatedAtomAPI.AddRecipient(`RuntimeSolvers`, id, player);

        statusEffectsReplicator?.InitActor(id);
        serverReplicatedAtomAPI.AddRecipient(`StatusEffects`, id, player);

        ctx.MarkCompleted(this.Id);
    }
}
