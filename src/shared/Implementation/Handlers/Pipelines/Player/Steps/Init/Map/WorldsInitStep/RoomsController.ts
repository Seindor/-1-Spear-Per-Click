import { Workspace, ReplicatedStorage } from "@rbxts/services";
import { Players } from "@rbxts/services";

import { PipelineContext } from "shared/Domain/Pipeline/Aggregates/PipelineContext";

import { ClientPlayerContext } from "shared/Types/Pipelines/ClientsPlayer/ClientPlayerPipeline";

import { Replicators } from "../../LoadReplicatorsStep/Replicators";

import { AbbreviateModule } from "shared/Utilities/AbbreviateModule";

import { PlayerData } from "shared/Types/Database/PlayerData";

import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";
import {
    IRuntimeGamePlayRoom,
    IRuntimeGamePlayWall,
    RuntimeGamePlayState,
} from "shared/Types/Replicators/Runtime/RuntimeGameplayState";
import { IWorld } from "shared/Types/Gameplay/Map/IWorld";
import { IRoom } from "shared/Types/Gameplay/Map/IWorld/IRoom";
import { Array } from "@rbxts/sift";
import { Create_Wall, IWall } from "shared/Implementation/Entities/Templates/Gameplay/World/Wall";
import { IWolrd, WallPreset } from "shared/Types/Gameplay/Worlds/IWorldTypes";
import { ParseRobloxAliasPath } from "shared/Utilities/GetObjectFromPath";
import { ClientSignals } from "shared/Implementation/Entities/ClientSignals";
import { AllSoundPaths, SoundsUtil } from "shared/Utilities/SoundsUtil";
import { SolverAggregate } from "shared/Domain/NumbersSolver/Aggregates/SolverAggregate";
import { Create_Wins_Solver } from "shared/Implementation/Entities/Solvers/Progression/WinsSolver";

const sharedScope = CompositionRootShared.createScope();

const uiWrapperAPI = sharedScope.resolve(SharedRegistry.Singletons.API.UIWrapperAPI);
const eventBusAPI = sharedScope.resolve(SharedRegistry.Singletons.API.EventBusAPI);
const janitorAPI = sharedScope.resolve(SharedRegistry.Singletons.API.JanitorAPI);
const clientAtomAPI = sharedScope.resolve(SharedRegistry.Singletons.API.ClientAtomAPI);
const hitboxAPI = sharedScope.resolve(SharedRegistry.Singletons.API.HitboxAPI);

let Assets = ReplicatedStorage.WaitForChild(`Assets`) as Folder;
let Models = Assets.WaitForChild(`Models`) as Folder;
let WorldsAssets = Models.WaitForChild(`Worlds`) as Folder;

let _Map = Workspace.WaitForChild(`Map`) as Folder;
let Worlds = _Map.WaitForChild(`Worlds`);

export class RoomsController {
    public id = `RoomsController`;

    public ctx: PipelineContext<ClientPlayerContext>;
    public winsSolver: SolverAggregate;
    public player: Player;

    public gamePlayState!: RuntimeGamePlayState;
    public currentRoom = 0;

    public _janitor = janitorAPI.Create(`Map`, `RoomsController`);

    public worldsData!: Array<IWolrd>;

    public rooms = new Map<number, IRoom>();
    public walls = new Map<number, Map<number, IWall>>();
    public miscData = new Map<string, any>();

    constructor(ctx: PipelineContext<ClientPlayerContext>) {
        this.ctx = ctx;
        this.winsSolver = Create_Wins_Solver(ctx.Data.id);
        this.player = Players.LocalPlayer;

        this.worldsData = require(
            ParseRobloxAliasPath(`shared/Info/GamePlay/Worlds`) as ModuleScript,
        ) as Array<IWolrd>;

        ctx.MarkLaunched(this.id);

        this.Init();
    }

    public Init() {
        this.WaitForPlayerData();
        this.InitSubscribers();
        this.BuildRooms();
    }

    private WaitForPlayerData() {
        while (!clientAtomAPI.GetAtom<Record<string, PlayerData>>(`RuntimeGamePlay`)) {
            task.wait(0.1);
        }

        let replicators = this.ctx.Get(`LoadReplicatorsStep/Replicators`) as
            | undefined
            | Replicators;

        while (!replicators) {
            replicators = this.ctx.Get(`LoadReplicatorsStep/Replicators`) as Replicators;
            task.wait(0.1);
        }

        while (!replicators.runtimeGameplay) {
            task.wait(0.1);
        }

        this.gamePlayState = replicators.runtimeGameplay;
    }

    public InitSubscribers() {
        let playerDataAtom = clientAtomAPI.GetAtom<Record<string, PlayerData>>(`RuntimeGamePlay`);

        if (playerDataAtom) {
            clientAtomAPI.Subscribe<Record<string, RuntimeGamePlayState>, RuntimeGamePlayState>(
                this.ctx.Data.id,
                `${this.id}/UpdateGamePlay`,
                `RuntimeGamePlay`,
                `${this.ctx.Data.id}`,
                (data) => {
                    this.gamePlayState = data!;
                    this.UpdateWalls();
                },
            );
        }

        ClientSignals.ReloadRoom.connect(() => {
            let currentWorldMap = Worlds.WaitForChild(`${this.gamePlayState.World.id}`) as IWorld;

            let character = this.player.Character as Model;
            let humanoidRootPart = character.WaitForChild(`HumanoidRootPart`) as BasePart;

            if (!humanoidRootPart) return;

            humanoidRootPart.CFrame = currentWorldMap.MainParts.Spawn.CFrame.mul(
                new CFrame(0, 5, 0),
            );

            this._janitor.Add(
                task.spawn(() => {
                    while (this.gamePlayState.World.completedRooms.size() > 0) {
                        task.wait(0.1);
                    }
                    this.ClearRooms();
                    this.currentRoom = 0;
                    this.BuildRooms();
                }),
                true,
                `ReloadRoom/ClearCompletedRooms`,
            );
        });
    }

    public UpdateWalls() {
        const walls = this.walls.get(this.currentRoom);
        if (!walls) return;

        const roomData = this.gamePlayState.World.rooms[this.currentRoom - 1];
        if (!roomData) return;

        for (const [wallIndex, wallModel] of walls) {
            if (!wallModel) continue;
            const wallData = roomData[wallIndex - 1];
            if (!wallData) continue;

            this.UpdateWallHealth(wallModel, wallData);
        }
    }

    public DamageWallVisual() {
        let sound = SoundsUtil.CreateSound(`Walls/Hit_${math.random(1, 4)}` as AllSoundPaths);
        SoundsUtil.PlaySound(sound, true, "SFXs");
    }

    public BreakWallVisual(wallModel: IWall, wall: IRuntimeGamePlayWall) {
        const walls = this.walls.get(this.currentRoom);
        const wallIndex = tonumber(wallModel.Name)!;

        wallModel.Transparency = 1;
        wallModel.CanCollide = false;

        walls?.delete(wallIndex);
        wallModel.Destroy();

        const sound = SoundsUtil.CreateSound(`Walls/Break` as AllSoundPaths);
        SoundsUtil.PlaySound(sound, true, "SFXs");
    }

    public UpdateWallHealth(wallModel: IWall, wall: IRuntimeGamePlayWall) {
        if (!wallModel) return;
        let healthBar = wallModel.Gui.Healthbar;
        let bar = healthBar.Bar;
        let counter = healthBar.Counter;

        let alpha = wall.health / wall.maxHealth;

        bar.Size = new UDim2(alpha, 0, 1, 0);
        counter.Text = `${AbbreviateModule.Currency(wall.health, 3)} / ${AbbreviateModule.Currency(wall.maxHealth, 3)}`;

        if (alpha === 0 && !wallModel.HasTag(`Broken`)) {
            this.BreakWallVisual(wallModel, wall);
            return;
        } else if (alpha < 1) {
            this.DamageWallVisual();
        }

        for (const texture of wallModel.GetChildren()) {
            if (texture.IsA(`Texture`)) {
                if (texture.Name === `Break_Texture`) {
                    texture.Transparency = alpha;
                }
            }
        }
    }

    public UpdateWallsHealth() {}

    public SetupWallVisual(
        roomIndex: number,
        wallindex: number,
        wall: IRuntimeGamePlayWall,
        wallModel: IWall,
    ) {
        let worldData = this.worldsData[this.gamePlayState.World.id - 1];
        let walldata = worldData.Walls[roomIndex];

        let wallPreset = WallPreset;

        let startColor = walldata.Start_Color ?? wallPreset.Start_Color!;
        let endColor = walldata.End_Color ?? wallPreset.End_Color!;
        let mult;

        if (
            this.gamePlayState.World.rooms[roomIndex - 1] &&
            this.gamePlayState.World.rooms[roomIndex - 1].size()
        ) {
            mult = this.gamePlayState.World.rooms[roomIndex - 1].size();
        } else {
            mult = 10;
        }

        let color = startColor.Lerp(endColor, wallindex / mult);

        let colorMapContent = walldata.ColorMapContent ?? wallPreset.ColorMapContent!;

        let offsetStudsU = walldata.OffsetStudsU ?? wallPreset.OffsetStudsU!;
        let offsetStudsV = walldata.OffsetStudsV ?? wallPreset.OffsetStudsV!;
        let studsPerTileU = walldata.StudsPerTileU ?? wallPreset.StudsPerTileU!;
        let studsPerTileV = walldata.StudsPerTileU ?? wallPreset.StudsPerTileV!;

        wallModel.Counter.Gui.Title.Text = `${AbbreviateModule.Currency(wallindex + (roomIndex - 1) * 10, 3)}`;

        wallModel.Color = color;

        this.UpdateWallHealth(wallModel, wall);

        for (const texture of wallModel.GetChildren()) {
            if (texture.IsA(`Texture`)) {
                if (texture.Name === `Tile_Texture`) {
                    texture.ColorMapContent = Content.fromUri(colorMapContent);
                    texture.OffsetStudsU = offsetStudsU;
                    texture.OffsetStudsV = offsetStudsV;
                    texture.StudsPerTileU = studsPerTileU;
                    texture.StudsPerTileV = studsPerTileV;
                }
            }
        }
    }

    public BuildWall(
        roomIndex: number,
        room: IRuntimeGamePlayRoom,
        roomModel: IRoom,
        wallIndex: number,
        wall: IRuntimeGamePlayWall,
    ) {
        let wallModel = Models.WaitForChild(`Wall`).Clone() as IWall;
        let mainParts = roomModel.WaitForChild(`MainParts`) as Folder;
        let startPart = mainParts.WaitForChild(`StartPart`) as BasePart;

        wallModel.CFrame = startPart.CFrame.add(new CFrame(0, 0, -(wallIndex - 1) * 13.2).Position);

        wallModel.Name = `${wallIndex}`;

        if (!this.walls.has(roomIndex)) {
            this.walls.set(roomIndex, new Map());
        }

        let walls = this.walls.get(roomIndex)!;
        walls.set(wallIndex, wallModel); // ключ = стабильный номер стены

        this.SetupWallVisual(roomIndex, wallIndex, wall, wallModel);
        wallModel.Parent = roomModel.Walls;
    }

    public RemoveWalls(roomIndex: number) {
        const walls = this.walls.get(roomIndex);
        if (!walls) return;

        for (const [, wall] of walls) {
            wall.Destroy();
        }

        walls.clear();
    }

    public BuildWalls(roomIndex: number, room: IRuntimeGamePlayRoom, roomModel: IRoom) {
        this.RemoveWalls(roomIndex);

        for (const [index, wall] of pairs(room)) {
            this.BuildWall(roomIndex, room, roomModel, index, wall);
        }
    }

    public SetupRoomVisual(roomIndex: number, roomModel: IRoom, room: IRuntimeGamePlayRoom) {
        let currentWorldMap = Worlds.WaitForChild(`${this.gamePlayState.World.id}`) as IWorld;
        let mainparts = currentWorldMap.WaitForChild(`MainParts`) as Folder;
        let roomsSpawn = mainparts.WaitForChild(`Rooms_Spawn`) as BasePart;

        roomModel.Name = `${roomIndex}`;

        let worldData = this.worldsData[this.gamePlayState.World.id - 1];
        let roomRewards = worldData.Rewards[roomIndex];

        let worldAssets = WorldsAssets.WaitForChild(`${this.gamePlayState.World.id}`) as Folder;

        let winsTitle = roomModel.Wins_Pad.Billboard_Part.BillboardGui.Amount_Title;
        let superWinsTitle = roomModel.SuperWins_Pad.Billboard_Part.BillboardGui.Amount_Title;

        winsTitle.Text = `+${AbbreviateModule.Currency(this.winsSolver.CalculateValue(roomRewards[`Wins`] as number), 3)} Wins (1x) 🏆`;
        superWinsTitle.Text = `+${AbbreviateModule.Currency(this.winsSolver.CalculateValue((roomRewards[`Wins`] * 2) as number), 3)} Wins (2x) 🏆`;

        const roomLength =
            roomModel.MainParts.EndPart.Position.Z - roomModel.MainParts.StartPart.Position.Z;

        roomModel.PivotTo(roomsSpawn.CFrame.mul(new CFrame(0, 0, roomLength * (roomIndex - 1))));

        roomModel.Parent = currentWorldMap.MainParts.Rooms;
    }

    public BuildRooms() {
        let currentWorldMap = Worlds.WaitForChild(`${this.gamePlayState.World.id}`) as IWorld;
        let mainparts = currentWorldMap.WaitForChild(`MainParts`) as Folder;
        let roomsSpawn = mainparts.WaitForChild(`Rooms_Spawn`) as BasePart;

        let worldAssets = WorldsAssets.WaitForChild(`${this.gamePlayState.World.id}`) as Folder;

        this.ClearRooms();

        for (const [index, room] of pairs(this.gamePlayState.World.rooms)) {
            let roomsFolder = worldAssets.WaitForChild(`Rooms`);
            let roomModel = roomsFolder.FindFirstChild(`${index}`) as IRoom | undefined;

            if (roomModel) {
                roomModel = roomsFolder.FindFirstChild(`${index}`)!.Clone() as IRoom;
            } else {
                roomModel = roomsFolder.WaitForChild(`1`).Clone() as IRoom;
            }

            this.SetupRoomVisual(index, roomModel, room);

            roomModel.Hitboxes.Wins_Pad.SetAttribute(`RoomId`, index);
            roomModel.Hitboxes.Super_Wins_Pad.SetAttribute(`RoomId`, index);

            this.rooms.set(index, roomModel);
            this.BuildWalls(index, room, roomModel);

            hitboxAPI.Create(`room_${index}_Click`, roomModel.Hitboxes.Click, {
                hitCooldown: 0.75,
                lifetime: math.huge,
                size: roomModel.Hitboxes.Click.Size,

                hitCheck: (target: BasePart) => {
                    let character = this.player.Character;

                    if (!character) return false;

                    let humanoidRootPart = character?.FindFirstChild(`HumanoidRootPart`);

                    if (!humanoidRootPart) return false;

                    if (target !== humanoidRootPart) return false;
                    if (this.currentRoom === index) return false;
                    if (this.gamePlayState.World.completedRooms.includes(index)) return false;

                    return true;
                },

                onHit: (target: BasePart) => {
                    this.currentRoom = index;
                    ClientSignals.UpdateSelectedRoom.fire(this.currentRoom);
                    this._janitor.Remove(`room_${index}_Click_HitEnd`);
                },
                onHitEnd: (targt: BasePart) => {
                    this._janitor.Add(
                        task.delay(1, () => {
                            this.currentRoom = 0;
                            ClientSignals.UpdateSelectedRoom.fire(this.currentRoom);
                        }),
                        true,
                        `room_${index}_Click_HitEnd`,
                    );
                },
            });

            hitboxAPI.Create(`room_${index}_Wins_Pad`, roomModel.Hitboxes.Wins_Pad, {
                hitCooldown: 1.5,
                lifetime: math.huge,
                size: roomModel.Hitboxes.Wins_Pad.Size,

                hitCheck: (target: BasePart) => {
                    let character = this.player.Character;

                    if (!character) return false;

                    let humanoidRootPart = character?.FindFirstChild(`HumanoidRootPart`);

                    if (!humanoidRootPart) return false;
                    if (target !== humanoidRootPart) return false;
                    if (!this.gamePlayState.World.completedRooms[index - 1]) return false;

                    return true;
                },

                onHit: (target: BasePart) => {
                    this.currentRoom = index;
                    ClientSignals.WinsPadTouched.fire(
                        `Wins_Pad`,
                        roomModel.Hitboxes.Wins_Pad.GetAttribute(`RoomId`) as number,
                    );
                },
            });

            hitboxAPI.Create(`room_${index}_Super_Wins_Pad`, roomModel.Hitboxes.Super_Wins_Pad, {
                hitCooldown: 1.5,
                lifetime: math.huge,
                size: roomModel.Hitboxes.Super_Wins_Pad.Size,

                hitCheck: (target: BasePart) => {
                    let character = this.player.Character;

                    if (!character) return false;

                    let humanoidRootPart = character?.FindFirstChild(`HumanoidRootPart`);

                    if (!humanoidRootPart) return false;
                    if (target !== humanoidRootPart) return false;
                    if (!this.gamePlayState.World.completedRooms[index - 1]) return false;

                    return true;
                },

                onHit: (target: BasePart) => {
                    this.currentRoom = index;
                    ClientSignals.WinsPadTouched.fire(
                        `Super_Wins_Pad`,
                        roomModel.Hitboxes.Super_Wins_Pad.GetAttribute(`RoomId`) as number,
                    );
                },
            });
        }
    }

    public ClearRooms() {
        for (const [index, room] of pairs(this.rooms)) {
            for (const wall of room.Walls.GetChildren()) {
                if (this.walls.has(index)) {
                    let walls = this.walls.get(index)!;
                    walls.delete(tonumber(wall.Name) as number);
                }

                wall.Destroy();
            }

            hitboxAPI.Destroy(`room_${index}_Click`);
            hitboxAPI.Destroy(`room_${index}_Wins_Pad`);
            hitboxAPI.Destroy(`room_${index}_Super_Wins_Pad`);

            this.walls.delete(index);
            this.rooms.delete(index);
            room.Destroy();
        }
    }
}
