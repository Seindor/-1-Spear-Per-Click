import { AlignOrientationAggregate } from "../Aggregates/AlignOrientationAggregate";
import { LinearVelocityAggregate } from "../Aggregates/LinearVelocityAggregate";
import { HighlightProperties } from "../Types/HighlightTypes";
import { HighlightAggregate } from "../Aggregates/HighlightAggregate";
import { AlignOrientationProperties, LinearVelocityProperties } from "../Types/AssetsHelperTypes";
import {
    AssetsHelperPresetPropertiesMap,
    AssetsHelperPresetReturnMap,
} from "../Types/AssetsHelperPresetTypes";

import { AssetHelperPresets } from "../Presets";
import { PresetPath, PresetReturn } from "../Types/PresetsTypes";

type DestroyableAsset = {
    Destroy(): void;
};

type PresetAssetType = keyof AssetsHelperPresetPropertiesMap;

type PresetName<TAssetType extends PresetAssetType> = Extract<
    keyof AssetsHelperPresetPropertiesMap[TAssetType],
    keyof AssetsHelperPresetReturnMap[TAssetType]
>;

export class AssetsHelperService {
    public Assets = new Map<string, DestroyableAsset>();

    public AlignOrientation(
        alignOrientationProperties: AlignOrientationProperties,
    ): AlignOrientationAggregate {
        const asset = new AlignOrientationAggregate(alignOrientationProperties);
        this.Assets.set(alignOrientationProperties.Name, asset);
        return asset;
    }

    public LinearVelocity(
        linearVelocityProperties: LinearVelocityProperties,
    ): LinearVelocityAggregate {
        const asset = new LinearVelocityAggregate(linearVelocityProperties);
        this.Assets.set(linearVelocityProperties.Name, asset);
        return asset;
    }

    public Highlight(highlightProperties: HighlightProperties): HighlightAggregate {
        const asset = new HighlightAggregate(highlightProperties);
        this.Assets.set(highlightProperties.Name ?? "Highlight", asset);
        return asset;
    }

    public Preset<T extends PresetPath>(path: T, name?: string): PresetReturn<T> {
        const preset = AssetHelperPresets[path](name);
        this.Assets.set(name ?? "Preset", preset);
        return preset as PresetReturn<T>;
    }

    public GetAsset(assetName: string): DestroyableAsset | undefined {
        return this.Assets.get(assetName);
    }

    public DestroyAsset(assetName: string) {
        const asset = this.Assets.get(assetName);
        if (!asset) {
            return;
        }

        asset.Destroy();
        this.Assets.delete(assetName);
    }
}
