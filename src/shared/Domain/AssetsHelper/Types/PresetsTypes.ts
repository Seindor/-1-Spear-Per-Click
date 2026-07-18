import { AssetHelperPresets } from "../Presets";

export type PresetPath = keyof typeof AssetHelperPresets;

export type PresetReturn<T extends PresetPath> = ReturnType<(typeof AssetHelperPresets)[T]>;
