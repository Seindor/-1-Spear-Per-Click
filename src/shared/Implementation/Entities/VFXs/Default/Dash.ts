import { TweenService, RunService, ReplicatedStorage, Workspace } from "@rbxts/services";

import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";
import { SoundsUtil } from "shared/Utilities/SoundsUtil";
import { disable, emit, enable } from "@zilibobi/forge-vfx";
import { Default } from ".";

let sharedScope = CompositionRootShared.createScope();

let assetsHelperAPI = sharedScope.resolve(SharedRegistry.Singletons.API.AssetsHelperAPI);

let Assets = ReplicatedStorage.WaitForChild("Assets") as Folder;
let VFXs = Assets.WaitForChild("VFXs") as Folder;
let DefaultVFXs = VFXs.WaitForChild("Default") as Folder;

export class Dash {
    private main: Default;

    constructor(_main: Default) {
        this.main = _main;
    }

    private createDodgeEffect(ownerId: string, character: Model, serverTime: number) {
        let janitor = this.main.GetJanitor(ownerId);
        let humanoidRootPart = character.WaitForChild(`HumanoidRootPart`) as BasePart;

        let timeOffset = Workspace.GetServerTimeNow() - serverTime;

        let dodgeTime = 0.4 - timeOffset;

        let perfectDashVFX = DefaultVFXs.WaitForChild(`PerfectDash`).Clone() as BasePart;
        let dodgeSFX = SoundsUtil.CreateSound(`Default/Dashes/Dodge`);
        let perfectDashWeld = new Instance(`Weld`);
        let perfectDashGroundVFX = DefaultVFXs.WaitForChild(
            `PerfectDashGround`,
        ).Clone() as BasePart;
        let ground = perfectDashVFX.WaitForChild(`Ground`) as Attachment;
        let wind = perfectDashVFX.WaitForChild(`Wind`) as Attachment;

        perfectDashWeld.Part0 = humanoidRootPart;
        perfectDashWeld.Part1 = perfectDashVFX;

        perfectDashGroundVFX.Parent = Workspace.WaitForChild(`Map`).WaitForChild(`Debris`);
        perfectDashVFX.Parent = Workspace.WaitForChild(`Map`).WaitForChild(`Debris`);
        dodgeSFX.Parent = humanoidRootPart;
        ground.Parent = Workspace.WaitForChild(`Map`).WaitForChild(`Debris`);
        wind.Parent = Workspace.WaitForChild(`Map`).WaitForChild(`Debris`);
        perfectDashWeld.Parent = humanoidRootPart;

        janitor.Add(perfectDashVFX, `Destroy`, `PerfecrtDash_VFX`);
        janitor.Add(dodgeSFX, `Destroy`, `DodgeSFX`);
        janitor.Add(perfectDashWeld, `Destroy`, `PerfecrtDash_Weld_VFX`);
        janitor.Add(ground, `Destroy`, `PerfecrtDash_Ground_VFX`);
        janitor.Add(wind, `Destroy`, `PerfecrtDash_Wind_VFX`);

        perfectDashWeld.Enabled = true;

        let rayOrigin = humanoidRootPart.Position;
        let rayDirection = humanoidRootPart.CFrame.UpVector.mul(-5);
        let rayParams = new RaycastParams();
        rayParams.FilterType = Enum.RaycastFilterType.Exclude;
        rayParams.FilterDescendantsInstances = [
            character,
            Workspace.WaitForChild("Map")!.WaitForChild("Players") as Folder,
            Workspace.WaitForChild("Map")!.WaitForChild("NPCs") as Folder,
        ];

        let rayResult = Workspace.Raycast(rayOrigin, rayDirection, rayParams);

        SoundsUtil.PlaySound(dodgeSFX, true);
        enable(perfectDashVFX);

        if (rayResult) {
            if (rayResult.Instance) {
                ground.Position = rayResult.Position;
                wind.Position = rayResult.Position.add(new Vector3(0, 3.161, 0));
            } else {
                ground.Destroy();
                wind.Destroy();
            }
        } else {
            ground.Destroy();
            wind.Destroy();
        }

        janitor.Add(
            RunService.Heartbeat.Connect(() => {
                let rayOrigin = humanoidRootPart.Position;
                let rayDirection = humanoidRootPart.CFrame.UpVector.mul(-5);
                let rayParams = new RaycastParams();
                rayParams.FilterType = Enum.RaycastFilterType.Exclude;
                rayParams.FilterDescendantsInstances = [
                    character,
                    Workspace.WaitForChild("Map")!.WaitForChild("Players") as Folder,
                    Workspace.WaitForChild("Map")!.WaitForChild("NPCs") as Folder,
                ];

                let rayResult = Workspace.Raycast(rayOrigin, rayDirection, rayParams);

                if (rayResult) {
                    if (rayResult.Instance) {
                        perfectDashGroundVFX.Position = rayResult.Position;

                        enable(perfectDashGroundVFX);
                    } else {
                        disable(perfectDashGroundVFX);
                    }
                } else {
                    disable(perfectDashGroundVFX);
                }
            }),
            `Disconnect`,
            `PerfectDashGround_VFX`,
        );

        janitor.Add(
            task.delay(dodgeTime * 1.2, () => {
                perfectDashVFX.Destroy();
                perfectDashWeld.Destroy();
                ground.Destroy();
                wind.Destroy();

                janitor.Remove(`PerfecrtDash_VFX`);
                janitor.Remove(`PerfecrtDash_Weld_VFX`);
                janitor.Remove(`PerfecrtDash_Ground_VFX`);
                janitor.Remove(`PerfecrtDashGround_VFX`);
                janitor.Remove(`PerfecrtDash_Wind_VFX`);
                janitor.Remove(`PerfecrtDash_Wind_VFX`);

                perfectDashGroundVFX.Destroy();
            }),
            true,
            `Remove_PerfecDash_VFXs`,
        );

        this.main.MakeInvisible(ownerId, character, dodgeTime);
        this.main.AfterImageEffect(ownerId, character, 0.075, 0.5, dodgeTime, undefined, 0.5, 1);
    }

    public Dash_Emit(character: Model, ownerId: string) {
        let janitor = this.main.GetJanitor(ownerId);

        janitor.Add(
            task.spawn(() => {
                let humanoidRootPart = character.WaitForChild("HumanoidRootPart") as BasePart;

                let sound = SoundsUtil.CreateSound(`Default/Dashes/Dash`);
                sound.Parent = humanoidRootPart;
                SoundsUtil.PlaySound(sound, true);

                janitor.Add(sound, "Destroy", `DashSound`);

                let rayOrigin = humanoidRootPart.Position;
                let rayDirection = humanoidRootPart.CFrame.UpVector.mul(-5);
                let rayParams = new RaycastParams();
                rayParams.FilterType = Enum.RaycastFilterType.Exclude;
                rayParams.FilterDescendantsInstances = [
                    character,
                    Workspace.WaitForChild("Map")!.WaitForChild("Players") as Folder,
                    Workspace.WaitForChild("Map")!.WaitForChild("NPCs") as Folder,
                ];

                let rayResult = Workspace.Raycast(rayOrigin, rayDirection, rayParams);

                if (rayResult) {
                    if (rayResult.Instance) {
                        let dashEffect = DefaultVFXs.WaitForChild(
                            "Dash_Effect",
                        ).Clone() as BasePart;
                        janitor.Add(dashEffect, "Destroy", `Dash_Effect`);
                        dashEffect.Parent = Workspace.WaitForChild("Map")!.WaitForChild(
                            "Debris",
                        ) as Folder;

                        dashEffect.Position = rayResult.Position;
                        emit(dashEffect);

                        task.delay(1.7, () => {
                            janitor.Remove(`Dash_Effect`);
                        });
                    }
                }
            }),
            true,
            `DashEmit`,
        );
    }

    public Dash_Interrupt(character: Model, ownerId: string) {
        let janitor = this.main.GetJanitor(ownerId);

        janitor.Remove(`DashEmit`);
        janitor.Remove(`DashSound`);
    }

    public Dodge(ownerId: string, character: Model, serverTime: number) {
        this.createDodgeEffect(ownerId, character, serverTime);
    }
}
