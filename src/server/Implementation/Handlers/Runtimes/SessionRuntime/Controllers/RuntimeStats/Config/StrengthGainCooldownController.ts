import { ReplicatedController } from "shared/Domain/Runtime/Components/ReplicatedController";

import { SessionContext } from "shared/Types/Runtime/SessionRuntime";

import { RuntimeEquipmentState } from "shared/Types/Replicators/Runtime/RuntimeEquipmentState";
import { RuntimeStatsReplicator } from "server/Implementation/Handlers/Replicators/Runtime/RuntimeStatsReplicator";

import { SolverAggregate } from "shared/Domain/NumbersSolver/Aggregates/SolverAggregate";
import { Create_Strength_Solver } from "shared/Implementation/Entities/Solvers/Progression/StrengthSolver";
import EventBusAggregate from "shared/Domain/EventBus/Aggregates/EventBusAggregate";
import GameItemData from "shared/Utilities/GameHelpers/GameItemData";
import { IWeaponData } from "shared/Utilities/GameHelpers/GameItemData/Types/IWeaponData";

import { DataHandler } from "server/Implementation/Handlers/Game/Data/DataHandler";
import { ServerReplicatedAtomAPI } from "shared/Domain/ReplicatedAtoms/API/ServerReplicatedAtomAPI";

import { CompositionRootServer } from "server/DI/CompositionRootServer";
import { ServerRegistry } from "server/DI/Generated/ServerRegistry";
import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";
import { Create_Strength_Gain_Cooldown_Solver } from "shared/Implementation/Entities/Solvers/Progression/StrengthGainCooldownSolver";

const serverScope = CompositionRootServer.createScope();
const sharedScope = CompositionRootShared.createScope();

const serverReplicatedAtomAPI = serverScope.resolve(
    ServerRegistry.Singletons.API.ServerAtomAPI,
) as ServerReplicatedAtomAPI;
const solverAPI = sharedScope.resolve(SharedRegistry.Singletons.API.SolverAPI);
const eventBusAPI = sharedScope.resolve(SharedRegistry.Singletons.API.EventBusAPI);

export class StrengthGainCooldownController extends ReplicatedController<SessionContext> {
    public readonly Name = `StrengthGainCooldownController`;

    public state = {
        Strength: 0,
    };

    public buses!: {
        progression: EventBusAggregate;
    };

    private dataHandler!: DataHandler;
    private strengthGainCooldownSolver!: SolverAggregate;

    protected OnInit(): void {
        print(`${this.Name} Initialized for ${this.runtime.Context.id}`);

        this.buses = {
            progression: eventBusAPI.New(this.runtime.Context.id, `Progression`),
        };

        let dataHandler = this.runtime.GetMeta<DataHandler>("DataHandler");
        let entitySolvers = solverAPI.NewPack(this.runtime.Context.id);

        if (!dataHandler) {
            warn(`[${this.Name}]: No DataHandler for ${this.runtime.Context.id}`);
            return;
        }

        this.dataHandler = dataHandler;

        this.strengthGainCooldownSolver = Create_Strength_Gain_Cooldown_Solver(
            this.runtime.Context.id,
        );

        this.SetupEvents();

        this.SyncToReplicator();
    }

    public InitEvents() {
        this.strengthGainCooldownSolver.Subscribe(
            ["Add", "Remove", "Set"],
            `StrengthGainCooldownController/Replicated`,
            () => {
                this.SyncToReplicator();
            },
        );
    }

    protected OnDestroy(): void {}

    protected Serialize(): void {}

    private SetupEvents() {}

    private SyncToReplicator() {
        if (!this.dataHandler) return;

        const data = this.dataHandler.GetData();

        const entityWeapon = data.equipment.weapon;
        const weaponData = GameItemData.GetGameplayItemData<IWeaponData>(`Weapons`, entityWeapon);

        let runtimeStatsReplicator =
            serverReplicatedAtomAPI.Get<RuntimeStatsReplicator>(`RuntimeStats`);

        runtimeStatsReplicator
            ?.UpdateDataWithPath(this.runtime.Context.id)
            .Set(
                `config/strengthGainCooldown`,
                this.strengthGainCooldownSolver.CalculateValue(weaponData.Cooldown),
            );
    }
}
