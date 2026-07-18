import { CurrencyPopupEffect } from "./Frame/CurrencyPopupEffect";
import { ScaleOnEnter } from "./Button/ScaleOnEnter";
import { ScaleOnActivate2 } from "./Frame/ScaleOnActivate2";
import { SpringEffect as SpringEffectFrame } from "./Frame/SpringEffect";
import { SpringEffect as SpringEffectButton } from "./Button/SpringEffect";
import { MoveFrame } from "./Frame/MoveFrame";

export const UIButtonEffectsPrototypes = {
    ["ScaleOnEnter"]: ScaleOnEnter,
    ["SpringEffect"]: SpringEffectButton,
};

export const UIFrameEffectsPrototypes = {
    ["ScaleOnActivate"]: ScaleOnActivate2,
    ["SpringEffect"]: SpringEffectFrame,
    ["CurrencyPopupEffect"]: CurrencyPopupEffect,
    [`MoveFrame`]: MoveFrame,
};

export type UIButtonEffectsPrototypeKey = keyof typeof UIButtonEffectsPrototypes;
export type UIFrameEffectsPrototypeKey = keyof typeof UIFrameEffectsPrototypes;
