export type CameraAxis = "Horizontal" | "Vertical" | "Roll";

export interface CameraState {
    Horizontal: number;
    Vertical: number;
    Roll: number;
}

export interface CameraConfig {
    Sensitivity?: number;
    Distance?: number;
    MinDistance?: number;
    MaxDistance?: number;
    Height?: number;
    VerticalLimitDeg?: number;
}
