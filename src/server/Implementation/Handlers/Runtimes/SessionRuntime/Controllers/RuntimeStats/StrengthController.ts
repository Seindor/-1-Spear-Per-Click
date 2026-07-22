import { ReplicatedController } from "shared/Domain/Runtime/Components/ReplicatedController";

import { SessionContext } from "shared/Types/Runtime/SessionRuntime";

import { RuntimeEquipmentState } from "shared/Types/Replicators/Runtime/RuntimeEquipmentState";

import { DataHandler } from "server/Implementation/Handlers/Game/Data/DataHandler";
import { ServerReplicatedAtomAPI } from "shared/Domain/ReplicatedAtoms/API/ServerReplicatedAtomAPI";

import { CompositionRootServer } from "server/DI/CompositionRootServer";
import { ServerRegistry } from "server/DI/Generated/ServerRegistry";
import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";
import { PlayerDataReplicator } from "server/Implementation/Handlers/Replicators/PlayerDataReplicator";
import { SolverAggregate } from "shared/Domain/NumbersSolver/Aggregates/SolverAggregate";
import { Create_Strength_Solver } from "shared/Implementation/Entities/Solvers/Progression/StrengthSolver";
import EventBusAggregate from "shared/Domain/EventBus/Aggregates/EventBusAggregate";
import { SolverNumberFactory } from "shared/Domain/NumbersSolver/Components/SolverNumberFactory";
import { RuntimeSolversReplicator } from "server/Implementation/Handlers/Replicators/Runtime/RuntimeSolversReplicator";

const serverScope = CompositionRootServer.createScope();
const sharedScope = CompositionRootShared.createScope();

const serverReplicatedAtomAPI = serverScope.resolve(
    ServerRegistry.Singletons.API.ServerAtomAPI,
) as ServerReplicatedAtomAPI;
const solverAPI = sharedScope.resolve(SharedRegistry.Singletons.API.SolverAPI);
const eventBusAPI = sharedScope.resolve(SharedRegistry.Singletons.API.EventBusAPI);

export class StrengthController extends ReplicatedController<SessionContext> {
    public readonly Name = `StrengthController`;

    public state = {
        Strength: 0,
    };

    public buses!: {
        progression: EventBusAggregate;
    };

    private dataHandler!: DataHandler;
    private strengthSolver!: SolverAggregate;

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

        this.strengthSolver = Create_Strength_Solver(this.runtime.Context.id);
        const data = this.dataHandler.GetData();

        this.state.Strength = data.progression.stats.strength;

        this.SetupEvents();

        this.SyncSolversReplicator();
        this.SyncToReplicator();
    }

    public AddStrength(value: number, flat?: boolean) {
        const data = this.dataHandler.GetData();

        let calculatedValue;

        if (flat === true) {
            calculatedValue = value;
        } else {
            calculatedValue = this.strengthSolver.CalculateValue(value);
        }

        data.progression.stats.strength += calculatedValue;
        this.state.Strength += calculatedValue;

        this.SyncToReplicator();
    }

    public RemoveStrength(value: number, flat?: boolean) {
        const data = this.dataHandler.GetData();

        let calculatedValue;

        if (flat === true) {
            calculatedValue = value;
        } else {
            calculatedValue = this.strengthSolver.CalculateValue(value);
        }

        data.progression.stats.strength -= calculatedValue;
        this.state.Strength -= calculatedValue;

        this.SyncToReplicator();
    }

    public SetStrength(value: number) {
        const data = this.dataHandler.GetData();

        data.progression.stats.strength = value;
        this.state.Strength = data.progression.stats.strength;

        this.SyncToReplicator();
    }

    protected OnDestroy(): void {}

    protected Serialize(): void {}

    private SetupEvents() {
        this.buses.progression.Subscribe(
            `AddStat`,
            (statId: string, value: number, flat?: boolean) => {
                if (statId === `Strength`) {
                    this.AddStrength(value, flat);
                }
            },
            undefined,
            `${this.Name}/AddStat`,
        );

        this.buses.progression.Subscribe(
            `RemoveStat`,
            (statId: string, value: number, flat?: boolean) => {
                if (statId === `Strength`) {
                    this.RemoveStrength(value, flat);
                }
            },
            undefined,
            `${this.Name}/AddStat`,
        );

        this.buses.progression.Subscribe(
            `SetStat`,
            (statId: string, value: number) => {
                if (statId === `Strength`) {
                    this.SetStrength(value);
                }
            },
            undefined,
            `${this.Name}/AddStat`,
        );
    }

    private SyncSolversReplicator() {
        let runtimeSolversReplicator =
            serverReplicatedAtomAPI.Get<RuntimeSolversReplicator>(`RuntimeSolvers`);

        const pushSnapshot = () => {
            runtimeSolversReplicator?.UpdateSolver(
                this.runtime.Context.id,
                this.strengthSolver.name,
                {
                    phases: this.strengthSolver.phases,
                    numbers: this.strengthSolver.GetSolverNumbers(),
                },
            );
        };

        pushSnapshot();
        this.strengthSolver.Subscribe(["Add", "Set", "Remove"], `Replication`, pushSnapshot);
    }

    private SyncToReplicator() {
        if (!this.dataHandler) return;

        const data = this.dataHandler.GetData();

        let playerDataReplicator = serverReplicatedAtomAPI.Get<PlayerDataReplicator>(`PlayerData`);

        playerDataReplicator
            ?.UpdateDataWithPath(this.runtime.Context.id)
            .Set(`progression/stats/strength`, data.progression.stats.strength);
    }
}
