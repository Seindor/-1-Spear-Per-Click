export type ClickDetectorCallbackType =
    | "MouseClick"
    | "RightMouseClick"
    | "MouseHoverEnter"
    | "MouseHoverLeave"
    | "PlayerEnteredRadius"
    | "PlayerLeftRadius"
    | "Destroying";

export interface ClickDetectorProperties {
    name: string;
    parent: BasePart;

    maxActivationDistance?: number;
    detectionRadius?: number;

    cursorIcon?: string;

    enableHighlight?: boolean;
}
