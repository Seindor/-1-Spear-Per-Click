import { Workspace, ReplicatedStorage, Players } from "@rbxts/services";

import { Pipeline } from "shared/Domain/Pipeline/Decorators/Pipeline";

import { CharacterContext, CharacterPipelineToken } from "../CharacterPipeline";
import { PipelineStep } from "shared/Domain/Pipeline/Aggregates/PipelineStep";
import { PipelineContext } from "shared/Domain/Pipeline/Aggregates/PipelineContext";

import Fusion, { Children } from "@rbxts/fusion";
import { IAppearance } from "shared/Types/Gameplay/PlayerAppearance";

import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";

const sharedScope = CompositionRootShared.createScope();

const entitiesStorageAPI = sharedScope.resolve(SharedRegistry.Singletons.API.EntitiesStorageAPI);
const eventBusAPI = sharedScope.resolve(SharedRegistry.Singletons.API.EventBusAPI);
const hitboxAPI = sharedScope.resolve(SharedRegistry.Singletons.API.HitboxAPI);
const animationsAPI = sharedScope.resolve(SharedRegistry.Singletons.API.AnimationsAPI);
const pipelineAPI = sharedScope.resolve(SharedRegistry.Singletons.API.PipelineAPI);

@Pipeline({ Pipeline: CharacterPipelineToken })
export class SetupSpawn extends PipelineStep<CharacterContext> {
    public readonly Id = "SetupSpawnStep";

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
        let character = ctx.Data.character;
        let humanoidRootPart = character.WaitForChild(`HumanoidRootPart`) as BasePart;

        hitboxAPI.TrackPart(humanoidRootPart, 0.5);
    }

    private Cleanup(ctx: PipelineContext<CharacterContext>) {
        let character = ctx.Data.character;
        let humanoidRootPart = character.WaitForChild(`HumanoidRootPart`) as BasePart;

        hitboxAPI.UntrackPart(humanoidRootPart);
        animationsAPI.RemoveActorAnimators(ctx.Data.id);
    }

    private SetupEntity(ctx: PipelineContext<CharacterContext>) {
        let entity = entitiesStorageAPI.AddEntity(ctx.Data.id, ctx.Data.character);
        let entityBus = eventBusAPI.New(ctx.Data.id, `Entity`);

        this.miscSetupStep(ctx);
        this.SetParent(ctx);

        if (ctx.Data.type === `Player`) {
            entity.AddTag(`Player`, true);
            ctx.Data.character.AddTag(`Player`);
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
