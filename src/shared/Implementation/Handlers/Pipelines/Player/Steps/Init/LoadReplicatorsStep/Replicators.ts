import { PipelineContext } from "shared/Domain/Pipeline/Aggregates/PipelineContext";
import { ClientPlayerContext } from "shared/Types/Pipelines/ClientsPlayer/ClientPlayerPipeline";

import { PlayerData } from "shared/Types/Database/PlayerData";

import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";
import { RuntimeStatsState } from "shared/Types/Replicators/Runtime/RuntimeStatsState";
import { RuntimeGamePlayState } from "shared/Types/Replicators/Runtime/RuntimeGameplayState";
import { Janitor } from "@rbxts/janitor";
import { SolverReplicationState } from "shared/Types/Replicators/Runtime/RuntimeSolversState";
import { subscribe } from "@rbxts/charm";

const sharedScope = CompositionRootShared.createScope();

const clientAtomAPI = sharedScope.resolve(SharedRegistry.Singletons.API.ClientAtomAPI);
const janitorAPI = sharedScope.resolve(SharedRegistry.Singletons.API.JanitorAPI);
const solverAPI = sharedScope.resolve(SharedRegistry.Singletons.API.SolverAPI);

export class Replicators {
    public id = `Replicators`;
    public ctx: PipelineContext<ClientPlayerContext>;
    public playerData: PlayerData | undefined;
    public runtimeStats: RuntimeStatsState | undefined;
    public runtimeGameplay: RuntimeGamePlayState | undefined;
    public _janitor: Janitor<any>;

    constructor(ctx: PipelineContext<ClientPlayerContext>) {
        this.ctx = ctx;
        this._janitor = janitorAPI.Create(ctx.Data.id, `Replicators`);

        clientAtomAPI.Subscribe<Record<string, PlayerData>, PlayerData>(
            ctx.Data.id,
            `${this.id}/PlayerData`,
            `PlayerData`,
            `${ctx.Data.id}`,
            (data) => {
                this.playerData = data;
                ctx.Set(`Replicators/PlayerData`, data);
            },
        );

        clientAtomAPI.Subscribe<Record<string, RuntimeStatsState>, RuntimeStatsState>(
            ctx.Data.id,
            `${this.id}/RuntimeStats`,
            `RuntimeStats`,
            `${ctx.Data.id}`,
            (data) => {
                this.runtimeStats = data;
                ctx.Set(`Replicators/RuntimeStats`, data);
            },
        );

        clientAtomAPI.Subscribe<Record<string, RuntimeGamePlayState>, RuntimeGamePlayState>(
            ctx.Data.id,
            `${this.id}/RuntimeGamePlay`,
            `RuntimeGamePlay`,
            `${ctx.Data.id}`,
            (data) => {
                this.runtimeGameplay = data;
                ctx.Set(`Replicators/RuntimeGamePlay`, data);
            },
        );

        this.InitSolversSync();
    }

    public InitSolversSync() {
        this._janitor.Add(
            task.spawn(() => {
                clientAtomAPI.WaitForChannel(`RuntimeSolvers`);

                let atom = clientAtomAPI.GetAtom<SolverReplicationState>(`RuntimeSolvers`);

                while (!atom) {
                    atom = clientAtomAPI.GetAtom<SolverReplicationState>(`RuntimeSolvers`);
                    task.wait(0.1);
                }

                this.SyncSolversFromServer(atom());

                subscribe(atom, (state) => this.SyncSolversFromServer(state));
            }),
            true,
            `GettingSolversAtom`,
        );
    }

    private SyncSolversFromServer(state: SolverReplicationState) {
        const packSnapshot = state[this.ctx.Data.id];
        if (!packSnapshot) return;

        const pack = solverAPI.NewPack(this.ctx.Data.id);

        for (const [solverName, snapshot] of pairs(packSnapshot)) {
            let solver = pack.GetSolver(solverName as string);

            if (!solver) {
                solver = pack.CreateSolver({
                    solverName: solverName as string,
                    phases: snapshot.phases,
                });
            }

            solver.phases = snapshot.phases;
            solver.ReplaceAllSolverNumbers(snapshot.numbers);
            print(solver, solver.CalculateValue(1));
        }
    }
}
