import { ReplicatedController } from "shared/Domain/Runtime/Components/ReplicatedController";

import { SessionContext } from "shared/Types/Runtime/SessionRuntime";

import { DataHandler } from "server/Implementation/Handlers/Game/Data/DataHandler";
import { ServerReplicatedAtomAPI } from "shared/Domain/ReplicatedAtoms/API/ServerReplicatedAtomAPI";

import { PlayerDataReplicator } from "server/Implementation/Handlers/Replicators/PlayerDataReplicator";
import { SolverAggregate } from "shared/Domain/NumbersSolver/Aggregates/SolverAggregate";
import EventBusAggregate from "shared/Domain/EventBus/Aggregates/EventBusAggregate";
import { SolverNumberFactory } from "shared/Domain/NumbersSolver/Components/SolverNumberFactory";
import { Create_Wins_Solver } from "shared/Implementation/Entities/Solvers/Progression/WinsSolver";
import { RuntimeSolversReplicator } from "server/Implementation/Handlers/Replicators/Runtime/RuntimeSolversReplicator";

import { CompositionRootServer } from "server/DI/CompositionRootServer";
import { ServerRegistry } from "server/DI/Generated/ServerRegistry";
import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";

const serverScope = CompositionRootServer.createScope();
const sharedScope = CompositionRootShared.createScope();

const serverReplicatedAtomAPI = serverScope.resolve(
    ServerRegistry.Singletons.API.ServerAtomAPI,
) as ServerReplicatedAtomAPI;
const solverAPI = sharedScope.resolve(SharedRegistry.Singletons.API.SolverAPI);
const eventBusAPI = sharedScope.resolve(SharedRegistry.Singletons.API.EventBusAPI);

export class WinsController extends ReplicatedController<SessionContext> {
    public readonly Name = `WinsController`;

    public state = {
        wins: 0,
    };

    public buses!: {
        progression: EventBusAggregate;
    };

    private dataHandler!: DataHandler;
    private winsSolver!: SolverAggregate;

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

        this.winsSolver = Create_Wins_Solver(this.runtime.Context.id);
        const data = this.dataHandler.GetData();

        this.state.wins = data.progression.stats.wins;

        this.SetupEvents();

        this.SyncSolversReplicator();
        this.SyncToReplicator();
    }

    public AddWins(value: number, flat?: boolean) {
        const data = this.dataHandler.GetData();

        let calculatedValue;

        if (flat === true) {
            calculatedValue = value;
        } else {
            calculatedValue = this.winsSolver.CalculateValue(value);
        }

        data.progression.stats.wins += calculatedValue;
        this.state.wins += calculatedValue;

        this.SyncToReplicator();
    }

    public RemoveWins(value: number, flat?: boolean) {
        const data = this.dataHandler.GetData();

        let calculatedValue;

        if (flat === true) {
            calculatedValue = value;
        } else {
            calculatedValue = this.winsSolver.CalculateValue(value);
        }

        data.progression.stats.wins -= calculatedValue;
        this.state.wins -= calculatedValue;

        this.SyncToReplicator();
    }

    public SetWins(value: number) {
        const data = this.dataHandler.GetData();

        data.progression.stats.wins = value;
        this.state.wins = data.progression.stats.wins;

        this.SyncToReplicator();
    }

    protected OnDestroy(): void {}

    protected Serialize(): void {}

    private SetupEvents() {
        this.buses.progression.Subscribe(
            `AddStat`,
            (statId: string, value: number, flat?: boolean) => {
                if (statId === `Wins`) {
                    this.AddWins(value, flat);
                }
            },
            undefined,
            `${this.Name}/AddStat`,
        );

        this.buses.progression.Subscribe(
            `RemoveStat`,
            (statId: string, value: number, flat?: boolean) => {
                if (statId === `Wins`) {
                    this.RemoveWins(value, flat);
                }
            },
            undefined,
            `${this.Name}/AddStat`,
        );

        this.buses.progression.Subscribe(
            `SetStat`,
            (statId: string, value: number) => {
                if (statId === `Wins`) {
                    this.SetWins(value);
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
            runtimeSolversReplicator?.UpdateSolver(this.runtime.Context.id, this.winsSolver.name, {
                phases: this.winsSolver.phases,
                numbers: this.winsSolver.GetSolverNumbers(),
            });
        };

        pushSnapshot();
        this.winsSolver.Subscribe(["Add", "Set", "Remove"], `Replication`, pushSnapshot);
    }

    private SyncToReplicator() {
        if (!this.dataHandler) return;

        const data = this.dataHandler.GetData();

        let playerDataReplicator = serverReplicatedAtomAPI.Get<PlayerDataReplicator>(`PlayerData`);

        playerDataReplicator
            ?.UpdateDataWithPath(this.runtime.Context.id)
            .Set(`progression/stats/wins`, data.progression.stats.wins);
    }
}
