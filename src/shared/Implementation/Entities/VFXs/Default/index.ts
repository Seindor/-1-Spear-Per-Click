import { Players, Workspace, ReplicatedStorage, TweenService } from "@rbxts/services";
import { Janitor } from "@rbxts/janitor";
import { Controller } from "@flamework/core";
import { Dash } from "./Dash";

import { IDefaultModels } from "./Types/IDefaultModels";

let Assets = ReplicatedStorage.WaitForChild(`Assets`) as Folder;
let Models = Assets.WaitForChild(`Models`) as Folder;
let DefaultModels = Models.WaitForChild(`Default`) as IDefaultModels;

@Controller()
export class Default {
    public player = Players.LocalPlayer;
    public playerStringId = tostring(this.player.UserId);
    public janitors = new Map<string, Janitor>();
    public Debris = new Map<string, any>();

    public vfxModules = {
        dash: new Dash(this),
    };

    public GetAllJanitors() {
        return this.janitors;
    }

    public GetJanitor(ownerId: string, character?: Model): Janitor<any> {
        if (this.janitors.has(ownerId)) return this.janitors.get(ownerId)!;
        let janitor = new Janitor<any>();

        if (character) {
            janitor.LinkToInstance(character, true);
        }

        this.janitors.set(ownerId, janitor);
        return janitor;
    }

    public MakeInvisible(ownerId: string, character: Model, time?: number) {
        let janitor = this.GetJanitor(ownerId);

        janitor.Remove(`Becombe_Visible`);

        janitor.Add(
            task.spawn(() => {
                for (const part of character.GetDescendants()) {
                    if (part.IsA(`BasePart`)) {
                        part.SetAttribute(`LastTransparency`, part.Transparency);
                        part.Transparency = 1;
                    }
                }
            }),
            true,
            `Becombe_Invisible`,
        );

        if (time) {
            janitor.Add(
                task.delay(time, () => this.MakeVisible(ownerId, character)),
                true,
                `Make_Visible`,
            );
        }
    }

    public MakeVisible(ownerId: string, character: Model) {
        let janitor = this.GetJanitor(ownerId);

        janitor.Remove(`Becombe_Invisible`);

        janitor.Add(
            task.spawn(() => {
                for (const part of character.GetDescendants()) {
                    if (part.IsA(`BasePart`)) {
                        part.Transparency = (part.GetAttribute(`LastTransparency`) as number) ?? 0;
                    }
                }
            }),
            true,
            `Becombe_Visible`,
        );
    }

    public AfterImageEffect(
        ownerId: string,
        mainCharacter: Model,
        spawnCooldown: number,
        tweenTime: number,
        lifeTime: number,
        offset?: CFrame,
        startTransparency?: number,
        endTransparency?: number,
    ) {
        let janitor = this.GetJanitor(ownerId);
        let start = Workspace.GetServerTimeNow();

        janitor.Add(
            task.spawn(() => {
                while (Workspace.GetServerTimeNow() - lifeTime < start) {
                    let character = DefaultModels.WaitForChild(`Models`)
                        .WaitForChild(`AfterImageCharacter`)
                        .Clone() as Model;

                    for (const part of character.GetDescendants()) {
                        if (part.IsA(`BasePart`)) {
                            let mainPart = mainCharacter.FindFirstChild(part.Name)! as BasePart;

                            part.Transparency = startTransparency ?? 0;

                            let Tween = TweenService.Create(
                                part,
                                new TweenInfo(tweenTime, Enum.EasingStyle.Linear),
                                { Transparency: endTransparency ?? 1 },
                            );

                            Tween.Play();
                            part.CFrame = mainPart.CFrame.mul(offset ?? new CFrame(0, 0, 0));
                        }
                    }

                    character.Name = `${mainCharacter.Name}_AfterImage_Clone`;
                    character.Parent = Workspace.WaitForChild(`Map`).WaitForChild(
                        `Debris`,
                    ) as Folder;

                    task.delay(tweenTime + 0.15, () => {
                        character.Destroy();
                    });

                    task.wait(spawnCooldown);
                }
            }),
            true,
            `AfterImage_Effect`,
        );
    }

    public Dash_Emit(character: Model, ownerId: string) {
        this.vfxModules.dash.Dash_Emit(character, ownerId);
    }

    public Dash_Interrupt(character: Model, ownerId: string) {
        this.vfxModules.dash.Dash_Interrupt(character, ownerId);
    }

    public Dodge(ownerId: string, character: Model, serverTime: number) {
        this.vfxModules.dash.Dodge(ownerId, character, serverTime);
    }
}
