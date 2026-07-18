import { Workspace } from "@rbxts/services";
import { HitboxShape } from "../Types/HitboxTypes";
import { Janitor } from "@rbxts/janitor";

class HitboxVisualizerClass {
    private visuals = new Map<string, BasePart>();
    private _janitor = new Janitor<any>();

    public CreateVisual(
        id: string,
        cf: CFrame,
        size: Vector3,
        shape: HitboxShape,
        isTouching: boolean,
    ) {
        let part = this.visuals.get(id);

        if (!part) {
            part = new Instance("Part");
            part.Anchored = true;
            part.CanCollide = false;
            part.CanQuery = false;
            part.Massless = true;
            part.Material = Enum.Material.ForceField;
            part.Color = Color3.fromRGB(255, 60, 60);
            part.Transparency = 0.5;
            part.Name = "Hitbox_" + id;

            part.Parent = Workspace;
            this.visuals.set(id, part);
        }

        if (isTouching) {
            part.Color = Color3.fromRGB(33, 255, 82);

            this._janitor.Remove(`${id}_LastTouch`);

            this._janitor.Add(
                task.delay(0.25, () => {
                    part.RemoveTag("LastTouch");
                }),
                true,
                `${id}_LastTouch`,
            );
        } else {
            if (!part.HasTag("LastTouch")) {
                part.Color = Color3.fromRGB(255, 60, 60);
            }
        }

        part.Size = size;
        part.CFrame = cf;

        const shapePart = part as Part;

        if (shape === "Ball") {
            shapePart.Shape = Enum.PartType.Ball;
        } else if (shape === "Cylinder") {
            shapePart.Shape = Enum.PartType.Cylinder;
        } else {
            shapePart.Shape = Enum.PartType.Block;
        }
    }

    public RemoveVisual(id: string) {
        const part = this.visuals.get(id);
        if (!part) return;

        part.Destroy();
        this.visuals.delete(id);
    }
}

export const HitboxVisualizer = new HitboxVisualizerClass();
