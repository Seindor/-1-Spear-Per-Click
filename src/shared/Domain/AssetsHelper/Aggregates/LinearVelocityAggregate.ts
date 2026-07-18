import { RunService } from "@rbxts/services";
import { Janitor } from "@rbxts/janitor";
import { LinearVelocityProperties } from "../Types/AssetsHelperTypes";

export class LinearVelocityAggregate {
    public instance: LinearVelocity;
    public attachment0?: Attachment;
    public attachment1?: Attachment;
    public _janitor = new Janitor<any>();

    constructor(linearVelocityProperties: LinearVelocityProperties) {
        this.instance = new Instance("LinearVelocity");
        this.instance.Enabled = linearVelocityProperties.Enabled ?? true;
        this.instance.ForceLimitMode =
            linearVelocityProperties.ForceLimitMode ?? Enum.ForceLimitMode.Magnitude;
        this.instance.MaxForce = linearVelocityProperties.MaxForce ?? 1000;
        this.instance.ForceLimitsEnabled = linearVelocityProperties.ForceLimitsEnabled ?? true;
        this.instance.RelativeTo =
            linearVelocityProperties.RelativeTo ?? Enum.ActuatorRelativeTo.World;
        this.instance.VelocityConstraintMode =
            linearVelocityProperties.VelocityConstraintMode ?? Enum.VelocityConstraintMode.Vector;

        if (this.instance.VelocityConstraintMode === Enum.VelocityConstraintMode.Vector) {
            this.instance.VectorVelocity =
                linearVelocityProperties.VectorVelocity ?? new Vector3(0, 0, 0);
        } else if (this.instance.VelocityConstraintMode === Enum.VelocityConstraintMode.Line) {
            this.instance.LineDirection =
                linearVelocityProperties.LineDirection ?? new Vector3(1, 0, 0);
            this.instance.LineVelocity = linearVelocityProperties.LineVelocity ?? 0;
        } else if (this.instance.VelocityConstraintMode === Enum.VelocityConstraintMode.Plane) {
            this.instance.PlaneVelocity =
                linearVelocityProperties.PlaneVelocity ?? new Vector2(0, 0);
            this.instance.PrimaryTangentAxis =
                linearVelocityProperties.PrimaryTangentAxis ?? new Vector3(1, 0, 0);
            this.instance.SecondaryTangentAxis =
                linearVelocityProperties.SecondaryTangentAxis ?? new Vector3(0, 1, 0);
        }

        if (linearVelocityProperties.Attachment0) {
            this.attachment0 = linearVelocityProperties.Attachment0!;

            if (linearVelocityProperties.DeleteAttachmentsOnDestroy) {
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

        if (linearVelocityProperties.Attachment1) {
            this.attachment1 = linearVelocityProperties.Attachment1!;

            if (linearVelocityProperties.DeleteAttachmentsOnDestroy) {
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
        this.instance.Parent = linearVelocityProperties.Parent;
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
