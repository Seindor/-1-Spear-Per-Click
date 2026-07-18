import { Workspace, RunService } from "@rbxts/services";
import { Janitor } from "@rbxts/janitor";
import { AlignOrientationAggregate } from "../../Aggregates/AlignOrientationAggregate";
import {
    FlyAlignOrientationPresetMethods,
    FlyAlignOrientationPresetProperties,
} from "../../Types/AssetsHelperPresetTypes";

export class FlyAlignOrientationPreset
    extends AlignOrientationAggregate
    implements FlyAlignOrientationPresetMethods
{
    private _speed = 0;
    private _targetSpeed = 0;
    private _lerpConnection?: RBXScriptConnection;
    private _presetJanitor = new Janitor<any>();

    constructor(properties: FlyAlignOrientationPresetProperties) {
        super({
            Name: properties.Name,
            Parent: properties.Parent,
            Mode: Enum.OrientationAlignmentMode.OneAttachment,
            Attachment0: properties.Attachment0,
            DeleteAttachmentsOnDestroy: properties.DeleteAttachmentsOnDestroy ?? false,
            MaxTorque: properties.MaxTorque ?? math.huge,
            Responsiveness: properties.Responsiveness ?? 60,
        });

        this.AddLoop("Preset_Fly_Rotation", 0, () => {
            const camera = Workspace.CurrentCamera;
            if (!camera) return;

            this.instance.CFrame = camera.CFrame;
        });
    }

    public SetResponsiveness(value: number) {
        this.instance.Responsiveness = value;
    }

    public LerpResponsiveness(target: number, duration: number) {
        if (this._lerpConnection) {
            this._lerpConnection.Disconnect();
            this._lerpConnection = undefined;
        }

        const start = this.instance.Responsiveness;
        let elapsed = 0;

        this._lerpConnection = RunService.Heartbeat.Connect((dt) => {
            elapsed += dt;
            const alpha = math.clamp(elapsed / duration, 0, 1);
            this.instance.Responsiveness = start + (target - start) * alpha;

            if (alpha >= 1) {
                this._lerpConnection?.Disconnect();
                this._lerpConnection = undefined;
            }
        });

        this._presetJanitor.Add(
            {
                Disconnect: () => {
                    this._lerpConnection?.Disconnect();
                    this._lerpConnection = undefined;
                },
            },
            "Disconnect",
            "ResponsivenessLerp",
        );
    }

    public override Destroy() {
        this._presetJanitor.Cleanup();
        super.Destroy();
    }
}
