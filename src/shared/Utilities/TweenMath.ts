export type EasingStyle =
    | "Linear"
    | "Sine"
    | "Quad"
    | "Cubic"
    | "Quart"
    | "Quint"
    | "Expo"
    | "Circ"
    | "Back"
    | "Elastic"
    | "Bounce";

export type EasingDirection = "In" | "Out" | "InOut";

function clamp01(value: number): number {
    return math.clamp(value, 0, 1);
}

function Ease(style: EasingStyle, direction: EasingDirection, alpha: number): number {
    const t = clamp01(alpha);

    if (style === "Linear") return t;

    switch (style) {
        case "Sine":
            switch (direction) {
                case "In":
                    return 1 - math.cos((t * math.pi) / 2);
                case "Out":
                    return math.sin((t * math.pi) / 2);
                case "InOut":
                    return -(math.cos(math.pi * t) - 1) / 2;
            }

        case "Quad":
            switch (direction) {
                case "In":
                    return t * t;
                case "Out":
                    return 1 - (1 - t) * (1 - t);
                case "InOut":
                    return t < 0.5 ? 2 * t * t : 1 - math.pow(-2 * t + 2, 2) / 2;
            }

        case "Cubic":
            switch (direction) {
                case "In":
                    return t * t * t;
                case "Out":
                    return 1 - math.pow(1 - t, 3);
                case "InOut":
                    return t < 0.5 ? 4 * t * t * t : 1 - math.pow(-2 * t + 2, 3) / 2;
            }

        case "Quart":
            switch (direction) {
                case "In":
                    return t * t * t * t;
                case "Out":
                    return 1 - math.pow(1 - t, 4);
                case "InOut":
                    return t < 0.5 ? 8 * t * t * t * t : 1 - math.pow(-2 * t + 2, 4) / 2;
            }

        case "Quint":
            switch (direction) {
                case "In":
                    return t * t * t * t * t;
                case "Out":
                    return 1 - math.pow(1 - t, 5);
                case "InOut":
                    return t < 0.5 ? 16 * t * t * t * t * t : 1 - math.pow(-2 * t + 2, 5) / 2;
            }

        case "Expo":
            switch (direction) {
                case "In":
                    return t === 0 ? 0 : math.pow(2, 10 * t - 10);
                case "Out":
                    return t === 1 ? 1 : 1 - math.pow(2, -10 * t);
                case "InOut":
                    if (t === 0) return 0;
                    if (t === 1) return 1;
                    return t < 0.5
                        ? math.pow(2, 20 * t - 10) / 2
                        : (2 - math.pow(2, -20 * t + 10)) / 2;
            }

        case "Circ":
            switch (direction) {
                case "In":
                    return 1 - math.sqrt(1 - t * t);
                case "Out":
                    return math.sqrt(1 - math.pow(t - 1, 2));
                case "InOut":
                    return t < 0.5
                        ? (1 - math.sqrt(1 - math.pow(2 * t, 2))) / 2
                        : (math.sqrt(1 - math.pow(-2 * t + 2, 2)) + 1) / 2;
            }

        case "Back": {
            const c1 = 1.70158;
            const c2 = c1 * 1.525;
            const c3 = c1 + 1;
            switch (direction) {
                case "In":
                    return c3 * t * t * t - c1 * t * t;
                case "Out":
                    return 1 + c3 * math.pow(t - 1, 3) + c1 * math.pow(t - 1, 2);
                case "InOut":
                    return t < 0.5
                        ? (math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
                        : (math.pow(2 * t - 2, 2) * ((c2 + 1) * (2 * t - 2) + c2) + 2) / 2;
            }
        }

        case "Elastic": {
            const c4 = (2 * math.pi) / 3;
            const c5 = (2 * math.pi) / 4.5;
            switch (direction) {
                case "In":
                    if (t === 0) return 0;
                    if (t === 1) return 1;
                    return -math.pow(2, 10 * t - 10) * math.sin((t * 10 - 10.75) * c4);
                case "Out":
                    if (t === 0) return 0;
                    if (t === 1) return 1;
                    return math.pow(2, -10 * t) * math.sin((t * 10 - 0.75) * c4) + 1;
                case "InOut":
                    if (t === 0) return 0;
                    if (t === 1) return 1;
                    return t < 0.5
                        ? -(math.pow(2, 20 * t - 10) * math.sin((20 * t - 11.125) * c5)) / 2
                        : (math.pow(2, -20 * t + 10) * math.sin((20 * t - 11.125) * c5)) / 2 + 1;
            }
        }

        case "Bounce": {
            const easeOutBounce = (x: number): number => {
                const n1 = 7.5625;
                const d1 = 2.75;
                if (x < 1 / d1) {
                    return n1 * x * x;
                } else if (x < 2 / d1) {
                    x -= 1.5 / d1;
                    return n1 * x * x + 0.75;
                } else if (x < 2.5 / d1) {
                    x -= 2.25 / d1;
                    return n1 * x * x + 0.9375;
                } else {
                    x -= 2.625 / d1;
                    return n1 * x * x + 0.984375;
                }
            };
            switch (direction) {
                case "In":
                    return 1 - easeOutBounce(1 - t);
                case "Out":
                    return easeOutBounce(t);
                case "InOut":
                    return t < 0.5
                        ? (1 - easeOutBounce(1 - 2 * t)) / 2
                        : (1 + easeOutBounce(2 * t - 1)) / 2;
            }
        }
    }

    return t;
}

function Lerp(
    from: number,
    to: number,
    alpha: number,
    style: EasingStyle = "Linear",
    direction: EasingDirection = "In",
): number {
    return from + (to - from) * Ease(style, direction, alpha);
}

function Bezier(
    from: number,
    to: number,
    control: number,
    alpha: number,
    style: EasingStyle = "Linear",
    direction: EasingDirection = "Out",
): number {
    const t = Ease(style, direction, clamp01(alpha));
    const inv = 1 - t;
    return inv * inv * from + 2 * inv * t * control + t * t * to;
}

function BezierUDim2(
    from: UDim2,
    to: UDim2,
    control: UDim2,
    alpha: number,
    style: EasingStyle = "Linear",
    direction: EasingDirection = "Out",
): UDim2 {
    const t = Ease(style, direction, clamp01(alpha));
    const inv = 1 - t;
    return new UDim2(
        inv * inv * from.X.Scale + 2 * inv * t * control.X.Scale + t * t * to.X.Scale,
        inv * inv * from.X.Offset + 2 * inv * t * control.X.Offset + t * t * to.X.Offset,
        inv * inv * from.Y.Scale + 2 * inv * t * control.Y.Scale + t * t * to.Y.Scale,
        inv * inv * from.Y.Offset + 2 * inv * t * control.Y.Offset + t * t * to.Y.Offset,
    );
}

const TweenMath = {
    Ease,
    Lerp,
    Bezier,
    BezierUDim2,
};

export default TweenMath;
