import { InsertService, Players } from "@rbxts/services";

export class AccessoryQualityFixHandler {
    private accessoryCache = new Map<number, BasePart>();

    public constructor() {
        for (const p of Players.GetPlayers()) {
            task.spawn(() => this.playerSetup(p));
        }

        Players.PlayerAdded.Connect((p) => {
            task.spawn(() => this.playerSetup(p));
        });
    }

    private loadAccessory(id: number, humanoid: Humanoid, character: Model) {
        const t = character.FindFirstChild("Torso");
        if (!t || !id) return;

        if (this.accessoryCache.has(id)) {
            const newAccessory = this.accessoryCache.get(id)!.Clone();
            newAccessory.Parent = character;

            const attachmentType = newAccessory.FindFirstChildOfClass("Attachment")!.Name;
            const attachmentOnBody = character.FindFirstChild(attachmentType, true) as Attachment;
            const attachmentPart = attachmentOnBody.Parent as BasePart;

            const weld = new Instance("WeldConstraint");
            weld.Parent = newAccessory;
            weld.Part0 = newAccessory;

            newAccessory.CFrame = attachmentOnBody.WorldCFrame.mul(
                (newAccessory.FindFirstChild(attachmentType) as Attachment).CFrame.Inverse(),
            );

            weld.Part1 = attachmentPart;
        } else {
            const asset = InsertService.LoadAsset(id);
            const handle = asset.GetChildren()[0].FindFirstChild("Handle") as BasePart;

            if (!handle) return;

            handle.CanCollide = false;
            handle.CanQuery = false;
            handle.CanTouch = false;
            handle.Massless = true;
            handle.Name = "Accessory";

            this.accessoryCache.set(id, handle.Clone());

            handle.Parent = character;

            const attachmentType = handle.FindFirstChildOfClass("Attachment")!.Name;
            const attachmentOnBody = character.FindFirstChild(attachmentType, true) as Attachment;
            const attachmentPart = attachmentOnBody.Parent as BasePart;

            const weld = new Instance("WeldConstraint");
            weld.Parent = handle;
            weld.Part0 = handle;

            handle.CFrame = attachmentOnBody.WorldCFrame.mul(
                (handle.FindFirstChild(attachmentType) as Attachment).CFrame.Inverse(),
            );

            weld.Part1 = attachmentPart;
        }
    }

    private characterSetup(character: Model) {
        const humanoid = character.WaitForChild("Humanoid") as Humanoid;

        if (!humanoid || humanoid.RigType === Enum.HumanoidRigType.R15) return;

        const ghd = humanoid.GetAppliedDescription();

        humanoid.RemoveAccessories();

        if (!ghd) return;

        if (tostring(ghd.BackAccessory) !== "") {
            for (const id of string.split(ghd.BackAccessory, ",")) {
                this.loadAccessory(tonumber(id)!, humanoid, character);
            }
        }

        if (tostring(ghd.FaceAccessory) !== "") {
            for (const id of string.split(ghd.FaceAccessory, ",")) {
                this.loadAccessory(tonumber(id)!, humanoid, character);
            }
        }

        if (tostring(ghd.FrontAccessory) !== "") {
            for (const id of string.split(ghd.FrontAccessory, ",")) {
                this.loadAccessory(tonumber(id)!, humanoid, character);
            }
        }

        if (tostring(ghd.HairAccessory) !== "") {
            for (const id of string.split(ghd.HairAccessory, ",")) {
                this.loadAccessory(tonumber(id)!, humanoid, character);
            }
        }

        if (tostring(ghd.HatAccessory) !== "") {
            for (const id of string.split(ghd.HatAccessory, ",")) {
                this.loadAccessory(tonumber(id)!, humanoid, character);
            }
        }

        if (tostring(ghd.NeckAccessory) !== "") {
            for (const id of string.split(ghd.NeckAccessory, ",")) {
                this.loadAccessory(tonumber(id)!, humanoid, character);
            }
        }

        if (tostring(ghd.ShouldersAccessory) !== "") {
            for (const id of string.split(ghd.ShouldersAccessory, ",")) {
                this.loadAccessory(tonumber(id)!, humanoid, character);
            }
        }

        if (tostring(ghd.WaistAccessory) !== "") {
            for (const id of string.split(ghd.WaistAccessory, ",")) {
                this.loadAccessory(tonumber(id)!, humanoid, character);
            }
        }
    }

    private playerSetup(player: Player) {
        player.CharacterAppearanceLoaded.Connect((character) => {
            this.characterSetup(character);
        });
    }
}
