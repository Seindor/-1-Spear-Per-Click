export type RenderDistanceCallbackType = "OnShown" | "OnHidden" | "Destroying";

export interface RenderDistanceProperties {
    instance: Instance;
    distance: number;
    origin: BasePart;
}
