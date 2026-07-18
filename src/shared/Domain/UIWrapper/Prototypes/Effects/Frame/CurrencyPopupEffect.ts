import { IUIFrameAggregate } from "../../../Types/TypedAggregates";
import TweenMath from "shared/Utilities/TweenMath";

const RunService = game.GetService("RunService");

export type CurrencyPopupParams = {
    target: GuiObject;
    bezierDuration?: number;
    controlPos?: UDim2;
    offset?: UDim2;
    spawnScaleDuration?: number;
    fadeScaleStart?: number;
};

export class CurrencyPopupEffect {
    public wrapper: IUIFrameAggregate;

    constructor(wrapper: IUIFrameAggregate) {
        this.wrapper = wrapper;
    }

    private GetTargetUDim2(moving: GuiObject, target: GuiObject, offset?: UDim2): UDim2 {
        const parent = moving.Parent as GuiObject;
        const parentAbsPos = parent.AbsolutePosition;
        const parentAbsSize = parent.AbsoluteSize;

        const relativePos = target.AbsolutePosition.sub(parentAbsPos).add(
            target.AbsoluteSize.mul(target.AnchorPoint),
        );

        const base = new UDim2(
            relativePos.X / parentAbsSize.X,
            0,
            relativePos.Y / parentAbsSize.Y,
            0,
        );

        return offset ? base.add(offset) : base;
    }

    public Emit(params: CurrencyPopupParams) {
        const moving = this.wrapper.instance as GuiObject;
        const uiScale = moving.WaitForChild("UIScale") as UIScale;

        const bezierDuration = params.bezierDuration ?? 1;
        const controlPos = params.controlPos ?? new UDim2(0.5, 0, 0.2, 0);
        const spawnScaleDuration = params.spawnScaleDuration ?? 0.1;
        const fadeScaleStart = params.fadeScaleStart ?? 0.7;

        const startPos = new UDim2(
            moving.Position.X.Scale,
            moving.Position.X.Offset,
            moving.Position.Y.Scale,
            moving.Position.Y.Offset,
        );

        const endPos = this.GetTargetUDim2(moving, params.target, params.offset);

        uiScale.Scale = 0;

        let elapsed = 0;

        const connection = RunService.Heartbeat.Connect((dt: number) => {
            elapsed += dt;

            if (elapsed <= spawnScaleDuration) {
                uiScale.Scale = TweenMath.Ease("Quart", "Out", elapsed / spawnScaleDuration);
            }

            const progress = elapsed / bezierDuration;

            moving.Position = TweenMath.BezierUDim2(
                startPos,
                endPos,
                controlPos,
                progress,
                "Quart",
                "In",
            );

            if (progress >= fadeScaleStart) {
                const fadeProgress = (progress - fadeScaleStart) / (1 - fadeScaleStart);
                uiScale.Scale = TweenMath.Ease("Quart", "In", 1 - fadeProgress);
            }

            if (elapsed >= bezierDuration) {
                uiScale.Scale = 0;
                moving.Position = endPos;
                connection.Disconnect();
            }
        });
    }
}
