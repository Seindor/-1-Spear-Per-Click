import { AlignOrientationAggregate } from "../Aggregates/AlignOrientationAggregate";
import { LinearVelocityAggregate } from "../Aggregates/LinearVelocityAggregate";
import { AssetsHelperService } from "../Services/AssetsHelperService";
import { AlignOrientationProperties, LinearVelocityProperties } from "../Types/AssetsHelperTypes";
import {
    AssetsHelperPresetPropertiesMap,
    AssetsHelperPresetReturnMap,
} from "../Types/AssetsHelperPresetTypes";
import { PresetPath, PresetReturn } from "../Types/PresetsTypes";

type PresetAssetType = keyof AssetsHelperPresetPropertiesMap;

type PresetName<TAssetType extends PresetAssetType> = Extract<
    keyof AssetsHelperPresetPropertiesMap[TAssetType],
    keyof AssetsHelperPresetReturnMap[TAssetType]
>;

export class AssetsHelperApi {
    private service = new AssetsHelperService();

    public AlignOrientation(
        alignOrientationProperties: AlignOrientationProperties,
    ): AlignOrientationAggregate {
        return this.service.AlignOrientation(alignOrientationProperties);
    }

    public LinearVelocity(
        linearVelocityProperties: LinearVelocityProperties,
    ): LinearVelocityAggregate {
        return this.service.LinearVelocity(linearVelocityProperties);
    }

    public Preset<T extends PresetPath>(path: T, name?: string): PresetReturn<T> {
        return this.service.Preset(path, name);
    }

    public GetAsset(assetName: string): { Destroy(): void } | undefined {
        return this.service.GetAsset(assetName);
    }

    public DestroyAsset(assetName: string) {
        this.service.DestroyAsset(assetName);
    }
}
