import { RunService } from "@rbxts/services";
import { IUIButtonAggregate } from "shared/Domain/UIWrapper/Types/TypedAggregates";

export type SpringEffectParams = {
    damping?: number;
    frequency?: number;
    amplitude?: number; // 👈 теперь корректная
    duration?: number;
    startScale?: number;
    targetScale?: number;
};

export class SpringEffect {
    public wrapper: IUIButtonAggregate;

    constructor(wrapper: IUIButtonAggregate) {
        this.wrapper = wrapper;
    }

    public Emit(params?: SpringEffectParams) {
        const uiScale = this.wrapper.instance.FindFirstChildWhichIsA("UIScale", true) as UIScale;

        if (!uiScale) {
            warn(`Can't find UIScale from ${this.wrapper}`);
        }

        const duration = params?.duration ?? 0.4;
        const damping = params?.damping ?? 7;
        const frequency = params?.frequency ?? 12;
        const amplitude = params?.amplitude ?? 1; // 👈 1 = норм, >1 сильнее

        const start = params?.startScale ?? uiScale.Scale;
        const _end = params?.targetScale ?? 1;

        let elapsed = 0;

        uiScale.Scale = start;

        const connection = RunService.Heartbeat.Connect((dt: number) => {
            elapsed += dt;

            const t = math.clamp(elapsed / duration, 0, 1);

            // 👇 базовая пружина
            const decay = math.exp(-damping * t);
            const oscillation = math.cos(frequency * t);

            // 👇 амплитуда усиливает только колебание
            const spring = decay * oscillation * amplitude;

            const value = _end + (start - _end) * math.exp(-damping * t) * math.cos(frequency * t);

            uiScale.Scale = value;

            uiScale.Scale = value;

            if (t >= 1) {
                uiScale.Scale = _end;
                connection.Disconnect();
            }
        });
    }
}
