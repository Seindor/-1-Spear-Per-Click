import { RunService } from "@rbxts/services";
import { Janitor } from "@rbxts/janitor";
import { AlignOrientationProperties } from "../Types/AssetsHelperTypes";

export class AlignOrientationAggregate {
    public instance: AlignOrientation;
    public attachment0?: Attachment;
    public attachment1?: Attachment;
    public _janitor = new Janitor<any>();

    constructor(alignOrientationProperties: AlignOrientationProperties) {
        this.instance = new Instance("AlignOrientation");

        this.instance.Parent = alignOrientationProperties.Parent;
        this.instance.Name = alignOrientationProperties.Name;
        this.instance.Enabled = alignOrientationProperties.Enabled ?? true;
        this.instance.Mode =
            alignOrientationProperties.Mode ?? Enum.OrientationAlignmentMode.TwoAttachment;
        this.instance.AlignType = alignOrientationProperties.AlignType ?? Enum.AlignType.AllAxes;
        this.instance.ReactionTorqueEnabled =
            alignOrientationProperties.ReactionTorqueEnabled ?? false;
        this.instance.RigidityEnabled = alignOrientationProperties.RigidityEnabled ?? false;

        if (alignOrientationProperties.Attachment0) {
            this.attachment0 = alignOrientationProperties.Attachment0!;

            if (alignOrientationProperties.DeleteAttachmentsOnDestroy) {
                this.instance.Attachment0 = this._janitor.Add(
                    this.attachment0,
                    "Destroy",
                    "Attachment0",
                );
            } else {
                this.instance.Attachment0 = this.attachment0;
            }
        } else {
            this.instance.Attachment0 = undefined;
        }

        if (alignOrientationProperties.Attachment1) {
            this.attachment1 = alignOrientationProperties.Attachment1!;

            if (alignOrientationProperties.DeleteAttachmentsOnDestroy) {
                this.instance.Attachment1 = this._janitor.Add(
                    this.attachment1,
                    "Destroy",
                    "Attachment1",
                );
            } else {
                this.instance.Attachment1 = this.attachment1;
            }
        } else {
            this.instance.Attachment1 = undefined;
        }

        this.instance.MaxAngularVelocity =
            alignOrientationProperties.MaxAngularVelocity ?? math.huge;
        this.instance.MaxTorque = alignOrientationProperties.MaxTorque ?? 10000;
        this.instance.Responsiveness = alignOrientationProperties.Responsiveness ?? 10;

        this._janitor.Add(this.instance, "Destroy", "AlignOrientation");
    }

    public AddLoop(name: string, time: number, callback: Callback) {
        if (time <= 0) {
            this._janitor.Add(
                RunService.Heartbeat.Connect(() => {
                    callback();
                }),
                "Disconnect",
                name,
            );
        } else {
            let conn = task.spawn(() => {
                while (true) {
                    callback();
                }
            });

            this._janitor.Add(conn, undefined, name);
        }
    }

    public RemoveLoop(name: string) {
        this._janitor.Remove(name);
    }

    public Destroy() {
        this._janitor.Cleanup();
        this.instance.Destroy();
    }
}
