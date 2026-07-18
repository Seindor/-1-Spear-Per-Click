import { RunService } from "@rbxts/services";

import TweenMath, { EasingStyle, EasingDirection } from "shared/Utilities/TweenMath";

import { Janitor } from "@rbxts/janitor";

import { IUIFrameAggregate } from "../../../Types/TypedAggregates";

export type MoveFrameParams = {
    duration?: number;
    target?: UDim2;
    style?: EasingStyle;
    direction?: EasingDirection;
};

export class MoveFrame {
    public readonly _janitor = new Janitor();

    constructor(public readonly wrapper: IUIFrameAggregate) {}

    public Emit(params?: MoveFrameParams) {
        const frame = this.wrapper.instance as Frame;

        let requiredParams = {
            duration: params?.duration ?? 0,
            target: params?.target ?? new UDim2(0.5, 0, 0.5, 0),
            style: params?.style ?? `Linear`,
            direction: params?.direction ?? `In`,
        };

        const start = frame.Position;
        const started = os.clock();

        this.wrapper._Janitor.Add(
            RunService.RenderStepped.Connect(() => {
                const elapsed = os.clock() - started;
                const alpha = math.clamp(elapsed / requiredParams.duration, 0, 1);

                frame.Position = new UDim2(
                    TweenMath.Lerp(
                        start.X.Scale,
                        requiredParams.target.X.Scale,
                        alpha,
                        requiredParams.style,
                        requiredParams.direction,
                    ),
                    TweenMath.Lerp(
                        start.X.Offset,
                        requiredParams.target.X.Offset,
                        alpha,
                        requiredParams.style,
                        requiredParams.direction,
                    ),
                    TweenMath.Lerp(
                        start.Y.Scale,
                        requiredParams.target.Y.Scale,
                        alpha,
                        requiredParams.style,
                        requiredParams.direction,
                    ),
                    TweenMath.Lerp(
                        start.Y.Offset,
                        requiredParams.target.Y.Offset,
                        alpha,
                        requiredParams.style,
                        requiredParams.direction,
                    ),
                );

                if (alpha >= 1) {
                    frame.Position = requiredParams!.target;
                    this.wrapper._Janitor.Remove(`MoveFrameEffect`);
                }
            }),
            `Disconnect`,
            `MoveFrameEffect`,
        );
    }
}
