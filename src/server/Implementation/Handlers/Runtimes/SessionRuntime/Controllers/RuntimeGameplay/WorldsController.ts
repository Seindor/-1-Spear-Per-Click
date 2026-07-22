import { Players } from "@rbxts/services";
import { ReplicatedController } from "shared/Domain/Runtime/Components/ReplicatedController";

import { SessionContext } from "shared/Types/Runtime/SessionRuntime";

import { RuntimeEquipmentState } from "shared/Types/Replicators/Runtime/RuntimeEquipmentState";

import { DataHandler } from "server/Implementation/Handlers/Game/Data/DataHandler";
import { ServerReplicatedAtomAPI } from "shared/Domain/ReplicatedAtoms/API/ServerReplicatedAtomAPI";

import { CompositionRootServer } from "server/DI/CompositionRootServer";
import { ServerRegistry } from "server/DI/Generated/ServerRegistry";
import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";
import { RuntimeGamePlayReplicator } from "server/Implementation/Handlers/Replicators/Runtime/RuntimeGamePlayReplicator";
import { SolverAggregate } from "shared/Domain/NumbersSolver/Aggregates/SolverAggregate";
import EventBusAggregate from "shared/Domain/EventBus/Aggregates/EventBusAggregate";
import { SolverNumberFactory } from "shared/Domain/NumbersSolver/Components/SolverNumberFactory";
import {
    IRuntimeGamePlayRoom,
    IRuntimeGamePlayWall,
    IRuntimeGamePlayWorld,
} from "shared/Types/Replicators/Runtime/RuntimeGameplayState";
import { Create_Damage_Solver } from "shared/Implementation/Entities/Solvers/Progression/DamageSolver";
import { IWolrd } from "shared/Types/Gameplay/Worlds/IWorldTypes";
import { ParseRobloxAliasPath } from "shared/Utilities/GetObjectFromPath";
import { DeepCloneComponent } from "shared/Domain/ReplicatedAtoms/Components/AtomPathAccessorComponent";
import { ServerSignals } from "shared/Implementation/Entities/SerrverSignals";

const serverScope = CompositionRootServer.createScope();
const sharedScope = CompositionRootShared.createScope();

const serverReplicatedAtomAPI = serverScope.resolve(
    ServerRegistry.Singletons.API.ServerAtomAPI,
) as ServerReplicatedAtomAPI;
const solverAPI = sharedScope.resolve(SharedRegistry.Singletons.API.SolverAPI);
const eventBusAPI = sharedScope.resolve(SharedRegistry.Singletons.API.EventBusAPI);

let deepCloneComponent = new DeepCloneComponent();

export class WorldsController extends ReplicatedController<SessionContext> {
    public readonly Name = `WorldsController`;

    public state: IRuntimeGamePlayWorld = {
        id: 1,
        rooms: [],
        completedRooms: [],
    };

    public selectedRoom = 0;

    public buses!: {
        gamePlay: EventBusAggregate;
        progression: EventBusAggregate;
    };

    private dataHandler!: DataHandler;
    private damageSolver!: SolverAggregate;

    private worldsData!: Record<number, IWolrd>;

    protected OnInit(): void {
        print(`${this.Name} Initialized for ${this.runtime.Context.id}`);

        this.worldsData = require(
            ParseRobloxAliasPath(`shared/Info/GamePlay/Worlds`) as ModuleScript,
        ) as Array<IWolrd>;

        let dataHandler = this.runtime.GetMeta<DataHandler>("DataHandler");
        let entitySolvers = solverAPI.NewPack(this.runtime.Context.id);

        if (!dataHandler) {
            warn(`[${this.Name}]: No DataHandler for ${this.runtime.Context.id}`);
            return;
        }

        this.dataHandler = dataHandler;

        this.buses = {
            gamePlay: eventBusAPI.New(this.runtime.Context.id, `GamePlay`),
            progression: eventBusAPI.New(this.runtime.Context.id, `Progression`),
        };

        let damageSolver = entitySolvers.GetSolver(`Strength`);
        if (!damageSolver) {
            warn(`[${this.Name}]: No Damage Solver for ${this.runtime.Context.id}, Creating...`);
            damageSolver = Create_Damage_Solver(this.runtime.Context.id);
        }

        this.damageSolver = damageSolver!;

        this.UpdateRooms();

        this.SetupEvents();
        this.SyncToReplicator();
    }

    protected OnDestroy(): void {}

    protected Serialize(): void {}

    private SetupEvents() {
        this.buses.gamePlay.Subscribe(
            `UpdateSelectedRoom`,
            (roomId: number) => {
                if (this.selectedRoom === roomId) return;

                if (roomId !== 1) {
                    if (!this.state.completedRooms.includes(roomId - 1)) return;
                }

                if (this.state.completedRooms.includes(roomId)) return;

                this.selectedRoom = roomId;
            },
            undefined,
            `${this.Name}/UpdateSelectedRoom`,
        );

        this.buses.gamePlay.Subscribe(
            `WinsPadTouched`,
            (winsPad: `Wins_Pad` | `Super_Wins_Pad`, roomId: number) => {
                if (winsPad === `Super_Wins_Pad`) {
                    let data = this.dataHandler.GetData();
                    if (!data.donation.gamePasses.some((pass) => pass.name === `Super_Wins`)) {
                        print(`Buy Super_Wins Pass`);
                        return;
                    }
                }

                this.ReloadRoom(winsPad, roomId);
            },
            undefined,
            `${this.Name}/WinsPadTouched`,
        );

        this.buses.gamePlay.Subscribe(
            `Weapon/Click`,
            () => {
                this.DamageWalls();
            },
            undefined,
            `${this.Name}/Weapon/Click`,
        );
    }

    public UpdateRooms() {
        let worldData = this.worldsData[this.state.id];

        if (!worldData) return;

        let health = worldData.Start_Health;

        this.selectedRoom = 0;
        this.state = {
            id: this.state.id,
            rooms: [],
            completedRooms: [],
        };

        for (const [index, scaling] of pairs(worldData.Health_Scaling)) {
            let newRoom: IRuntimeGamePlayRoom = [];

            for (let i = 1; i <= 10; i++) {
                let wall: IRuntimeGamePlayWall = {
                    health: health,
                    maxHealth: health,
                };

                newRoom.push(wall);

                health = math.round(health * scaling * 1000) / 1000;
            }

            this.state.rooms.push(newRoom);

            this.SyncToReplicator();
        }
    }

    public ReloadRoom(winsPad: `Wins_Pad` | `Super_Wins_Pad`, roomId: number) {
        let player = Players.GetPlayerByUserId(tonumber(this.runtime.Context.id) as number);
        if (!player) return;

        if (!this.state.completedRooms[roomId - 1]) return;

        this.selectedRoom = 0;

        let wolrdData = this.worldsData[this.state.id];
        let roomRewards = wolrdData.Rewards[roomId];

        if (!roomRewards) return;

        let mult = winsPad === `Wins_Pad` ? 1 : 2;

        this.UpdateRooms();
        ServerSignals.ReloadRoom.fire(player);

        for (const [index, reward] of pairs(roomRewards)) {
            this.buses.progression.Fire(`AddStat`, undefined, undefined, index, reward * mult);
        }
    }

    public DamageWalls() {
        if (this.selectedRoom === 0) return;
        if (this.state.completedRooms.includes(this.selectedRoom)) return;

        let data = this.dataHandler.GetData();
        let room = this.state.rooms[this.selectedRoom - 1];
        let damage = this.damageSolver.CalculateValue(data.progression.stats.strength);

        if (damage <= 0) return;

        for (const wall of room) {
            if (damage <= 0) continue;
            let currentHealth = wall.health;
            wall.health = math.clamp(wall.health - damage, 0, math.huge);
            damage = math.clamp(damage - currentHealth, 0, math.huge);
        }

        let completedCounter = 0;

        for (const wall of room) {
            if (wall.health <= 0) {
                completedCounter += 1;
            }
        }

        if (completedCounter >= room.size()) {
            this.state.completedRooms.push(this.selectedRoom);
        }

        this.SyncToReplicator();
    }

    private SyncToReplicator() {
        if (!this.dataHandler) return;

        let runtimeGamePlayReplicator =
            serverReplicatedAtomAPI.Get<RuntimeGamePlayReplicator>(`RuntimeGamePlay`);

        runtimeGamePlayReplicator
            ?.UpdateDataWithPath(this.runtime.Context.id)
            .Set(`World`, this.state);
    }
}
