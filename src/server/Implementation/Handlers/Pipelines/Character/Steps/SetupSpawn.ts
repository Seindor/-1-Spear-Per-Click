import { Workspace, ReplicatedStorage, Players } from "@rbxts/services";

import { Pipeline } from "shared/Domain/Pipeline/Decorators/Pipeline";

import { CharacterContext, CharacterPipelineToken } from "../CharacterPipeline";
import { PipelineStep } from "shared/Domain/Pipeline/Aggregates/PipelineStep";
import { PipelineContext } from "shared/Domain/Pipeline/Aggregates/PipelineContext";

import Fusion, { Children } from "@rbxts/fusion";
import { IAppearance } from "shared/Types/Gameplay/PlayerAppearance";

import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";
import { PlayerPipelineToken } from "../../Player/PlayerPipeline";
import { DataHandler } from "server/Implementation/Handlers/DataHandler";
import { ISlotData } from "shared/Types/Database/PlayerData";
import { IsPlaceBlacklisted, PlaceBlacklist } from "shared/Types/Game/ServerInfo";

const sharedScope = CompositionRootShared.createScope();

const entitiesStorageAPI = sharedScope.resolve(SharedRegistry.Singletons.API.EntitiesStorageAPI);
const eventBusAPI = sharedScope.resolve(SharedRegistry.Singletons.API.EventBusAPI);
const hitboxAPI = sharedScope.resolve(SharedRegistry.Singletons.API.HitboxAPI);
const animationsAPI = sharedScope.resolve(SharedRegistry.Singletons.API.AnimationsAPI);
const pipelineAPI = sharedScope.resolve(SharedRegistry.Singletons.API.PipelineAPI);

@Pipeline({ Pipeline: CharacterPipelineToken })
export class SetupSpawn extends PipelineStep<CharacterContext> {
    public readonly Id = "SetupSpawnStep";

    public Blacklist = [`Main Menu`] as PlaceBlacklist;

    private createAppearance(): IAppearance {
        let appearance = Fusion.New("Folder")({
            Name: "Appearance",

            [Children]: [
                Fusion.New("Folder")({
                    Name: "Arms",
                }),

                Fusion.New("Folder")({
                    Name: "Torso",
                }),

                Fusion.New("Folder")({
                    Name: "Back",
                }),

                Fusion.New("Folder")({
                    Name: "Legs",
                }),

                Fusion.New("Folder")({
                    Name: "Weapon",

                    [Children]: [
                        Fusion.New("Folder")({
                            Name: "Welds",
                        }),

                        Fusion.New("Folder")({
                            Name: "Models",
                        }),
                    ],
                }),

                Fusion.New("Folder")({
                    Name: "Face",
                }),

                Fusion.New("Folder")({
                    Name: "Others",
                }),

                Fusion.New("Folder")({
                    Name: "Hat",
                }),

                Fusion.New("Folder")({
                    Name: "Handlers",

                    [Children]: [
                        Fusion.New("Folder")({
                            Name: "Motors",
                        }),

                        Fusion.New("Folder")({
                            Name: "Parts",
                        }),
                    ],
                }),
            ],
        }) as IAppearance;
        return appearance;
    }

    private createHandler(appearance: IAppearance, character: Model, handleName: "LH" | "RH") {
        let appearancy = appearance;
        let leftArm = character.FindFirstChild("Left Arm")! as BasePart;
        let rightArm = character.FindFirstChild("Right Arm")! as BasePart;

        let selectedArm;

        if (handleName === "LH") {
            selectedArm = leftArm;
        } else {
            selectedArm = rightArm;
        }

        let handle = new Instance("Part");
        handle.Name = handleName;
        handle.Transparency = 1;
        handle.CanCollide = false;
        handle.Massless = true;
        handle.CanQuery = false;
        handle.AudioCanCollide = false;

        handle.Size = new Vector3(0.364, 0.158, 1.025);

        let motor = new Instance("Motor6D");
        motor.Name = `${handleName}M`;
        motor.Enabled = false;
        motor.Part0 = selectedArm!;
        motor.Part1 = handle;

        if (handleName === "LH") {
            motor.C0 = new CFrame(0.2, -1, 0);
        } else {
            motor.C0 = new CFrame(-0.2, -1, 0);
        }

        motor.Enabled = true;
        motor.Parent = appearancy.Handlers.Motors;
        handle.Parent = appearancy.Handlers.Parts;
    }

    private CreateHandlers(appearance: IAppearance, character: Model) {
        this.createHandler(appearance, character, "LH");
        this.createHandler(appearance, character, "RH");
    }

    private SetParent(ctx: PipelineContext<CharacterContext>) {
        let MapFolder = Workspace.WaitForChild(`Map`) as Folder;
        let PlayersFolder = MapFolder.WaitForChild(`Players`) as Folder;
        let NPCsFolder = MapFolder.WaitForChild(`NPCs`) as Folder;

        if (ctx.Data.type === `Player`) {
            ctx.Data.character.Parent = PlayersFolder;
        } else {
            ctx.Data.character.Parent = NPCsFolder;
        }
    }

    private miscSetupStep(ctx: PipelineContext<CharacterContext>) {
        hitboxAPI.TrackModel(ctx.Data.character);
    }

    private Cleanup(ctx: PipelineContext<CharacterContext>) {
        hitboxAPI.UntrackModel(ctx.Data.character);
        animationsAPI.RemoveActorAnimators(ctx.Data.id);
    }

    private async loadPlayerVisual(ctx: PipelineContext<CharacterContext>): Promise<void> {
        const userId = tonumber(ctx.Data.id);
        assert(userId !== undefined, `[loadPlayerVisual] Invalid userId "${ctx.Data.id}"`);

        const character = ctx.Data.character;

        let playerCtx = pipelineAPI.GetContext(PlayerPipelineToken, ctx.Data.id);

        while (!playerCtx || !playerCtx.IsFinished()) {
            playerCtx = pipelineAPI.GetContext(PlayerPipelineToken, ctx.Data.id);
            task.wait(1);
        }

        if (!playerCtx || !playerCtx.IsFinished()) {
            warn(`[SetupSpawn] Player pipeline for ${ctx.Data.id} is not finished yet`);
            return;
        }

        const dataHandler = playerCtx.Get<DataHandler>("DataHandler");

        if (!dataHandler) {
            warn(`[SetupSpawn] data handler is nil`);
            return;
        }

        const data = dataHandler.GetData();
        const slot = data.slots.find((slot) => slot.slotInfo.slotId === data.currentSlot);

        if (!slot) {
            warn(`[SetupSpawn] character slot is nil`);
            return;
        }

        this.setupGender(slot, character);
        this.setupClothing(slot, character);

        const humanoid = character.FindFirstChildOfClass("Humanoid");
        assert(humanoid, `[loadPlayerVisual] Humanoid not found on character`);

        const [ok, appearance] = pcall(() => Players.GetCharacterAppearanceAsync(userId));

        if (!ok || !appearance) {
            warn(`[loadPlayerVisual] Failed to fetch appearance for ${userId}`);
            return;
        }

        this.applyHair(character, humanoid, appearance as Model);
        this.applySkinColor(character, appearance as Model);

        (appearance as Model).Destroy();
    }

    private setupGender(slot: ISlotData, character: Model) {
        const gender = slot.character.profile.gender;

        if (gender === `Female`) {
            let characterMesh = new Instance(`CharacterMesh`);
            characterMesh.BodyPart = Enum.BodyPart.Torso;
            characterMesh.MeshId = 48112070;
            characterMesh.Parent = character;
        }
    }

    private setupClothing(slot: ISlotData, character: Model) {
        const Assets = ReplicatedStorage.WaitForChild(`Assets`) as Folder;
        const ClothingAssets = Assets.WaitForChild(`Clothing`);

        const clothing = slot.character.equipment.clothing;
        const gender = slot.character.profile.gender;

        let shirt = character.WaitForChild(`Shirt`) as Shirt;
        let pants = character.WaitForChild(`Pants`) as Pants;

        if (!clothing.shirt.id && !clothing.pants.id) {
            let clothingFolder = ClothingAssets.WaitForChild(clothing.shirt.name) as Folder;
            let genderClothingFolder = clothingFolder.WaitForChild(gender) as Folder;

            let shirtAsset = genderClothingFolder.WaitForChild(`Shirt`) as Shirt;
            let pantsAsset = genderClothingFolder.WaitForChild(`Pants`) as Pants;

            let shirtTemplate = shirtAsset.ShirtTemplate;
            let pantstemplate = pantsAsset.PantsTemplate;

            shirt.ShirtTemplate = shirtTemplate;
            pants.PantsTemplate = pantstemplate;
        } else {
            shirt.ShirtTemplate = clothing.shirt.id ?? ``;
            pants.PantsTemplate = clothing.pants.id ?? ``;
        }
    }

    private applyHair(character: Model, humanoid: Humanoid, appearance: Model): void {
        const head = character.WaitForChild(`Head`);

        for (const child of appearance.GetChildren()) {
            if (!child.IsA("Accessory")) continue;

            if (
                child.AccessoryType !== Enum.AccessoryType.Hair &&
                child.AccessoryType !== Enum.AccessoryType.Unknown
            )
                continue;

            let clone = child.Clone();

            clone.Parent = character;

            let handle = clone.FindFirstChild(`Handle`) as BasePart;

            if (!handle.FindFirstChild(`HairAttachment`)) {
                clone.Destroy();
                continue;
            }

            if (!handle) {
                clone.Destroy();
                continue;
            }

            let accessoryWeld = handle.FindFirstChild(`AccessoryWeld`) as Weld;

            if (!accessoryWeld) {
                clone.Destroy();
                continue;
            }

            if (clone.FindFirstChildWhichIsA(`Camera`)) {
                clone.FindFirstChildWhichIsA(`Camera`)?.Destroy();
            }

            if (accessoryWeld.Part1 !== head) {
                clone.Destroy();
            }
        }
    }

    private applySkinColor(character: Model, appearance: Model): void {
        appearance.WaitForChild(`Body Colors`).Parent = character;
    }

    private SetupEntity(ctx: PipelineContext<CharacterContext>) {
        let entity = entitiesStorageAPI.AddEntity(ctx.Data.id, ctx.Data.character);
        let entityBus = eventBusAPI.New(ctx.Data.id, `Entity`);

        this.miscSetupStep(ctx);
        this.SetParent(ctx);

        if (ctx.Data.type === `Player`) {
            entity.AddTag(`Player`, true);
            ctx.Data.character.AddTag(`Player`);

            if (!IsPlaceBlacklisted(this.Blacklist)) {
                this.loadPlayerVisual(ctx);
            }
        } else {
            entity.AddTag(`NPC`);
            ctx.Data.character.AddTag(`NPC`);
        }

        entityBus.Subscribe(
            `Health/Executed`,
            (health: number, maxHealth: number) => {
                this.Cleanup(ctx);
            },
            undefined,
            `Character/SetupStep/SetupEntity`,
        );

        entityBus.Fire(`Character/Created`, undefined, true, ctx.Data.character);
    }

    public Execute(ctx: PipelineContext<CharacterContext>): void {
        let appearance = this.createAppearance();
        appearance.Parent = ctx.Data.character;

        this.CreateHandlers(appearance, ctx.Data.character);
        this.SetupEntity(ctx);

        ctx.Data.character.SetAttribute(`CharacterSetuped`, true);
        ctx.MarkCompleted(this.Id);
    }
}
