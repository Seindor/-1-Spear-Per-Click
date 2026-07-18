import { AlignOrientationAggregate } from "../Aggregates/AlignOrientationAggregate";
import { LinearVelocityAggregate } from "../Aggregates/LinearVelocityAggregate";

export interface FlyAlignOrientationPresetProperties {
    Name: string;
    Parent: BasePart;
    Attachment0: Attachment;
    Responsiveness?: number;
    MaxTorque?: number;
    DeleteAttachmentsOnDestroy?: boolean;
}

export interface LookAtCameraAlignOrientationPresetProperties {
    Name: string;
    Parent: BasePart;
    Attachment0: Attachment;
    Responsiveness?: number;
    MaxTorque?: number;
    DeleteAttachmentsOnDestroy?: boolean;
}

export interface FlyLinearVelocityPresetProperties {
    Name: string;
    Parent: BasePart;
    Attachment0: Attachment;
    Humanoid: Humanoid;
    Speed?: number;
    MaxForce?: number;
    DeleteAttachmentsOnDestroy?: boolean;
    StartTime?: number;
    StopTime?: number;
}

export interface DashLinearVelocityPresetProperties {
    Name: string;
    Parent: BasePart;
    Attachment0: Attachment;
    Direction: Vector3;
    Speed: number;
    MaxForce?: number;
    DeleteAttachmentsOnDestroy?: boolean;
    Duration?: number;
}

export interface AssetsHelperPresetNameMap {
    AlignOrientation: "Fly" | "LookAtCamera";
    LinearVelocity: "Fly" | "Dash";
}

export interface AssetsHelperPresetPropertiesMap {
    AlignOrientation: {
        Fly: FlyAlignOrientationPresetProperties;
        LookAtCamera: LookAtCameraAlignOrientationPresetProperties;
    };
    LinearVelocity: {
        Fly: FlyLinearVelocityPresetProperties;
        Dash: DashLinearVelocityPresetProperties;
    };
}

export interface FlyAlignOrientationPresetMethods extends AlignOrientationAggregate {
    SetResponsiveness(value: number): void;
    LerpResponsiveness(target: number, duration: number): void;
}

export interface LookAtCameraAlignOrientationPresetMethods extends AlignOrientationAggregate {
    SetResponsiveness(value: number): void;
    LerpResponsiveness(target: number, duration: number): void;
}

export interface FlyLinearVelocityPresetMethods extends LinearVelocityAggregate {
    SetSpeed(value: number): void;
    LerpSpeed(target: number, duration: number): void;
    Stop(): void;
}

export interface DashLinearVelocityPresetMethods extends LinearVelocityAggregate {
    Fire(): void;
}

export interface AssetsHelperPresetReturnMap {
    AlignOrientation: {
        Fly: FlyAlignOrientationPresetMethods;
        LookAtCamera: LookAtCameraAlignOrientationPresetMethods;
    };
    LinearVelocity: {
        Fly: FlyLinearVelocityPresetMethods;
        Dash: DashLinearVelocityPresetMethods;
    };
}
