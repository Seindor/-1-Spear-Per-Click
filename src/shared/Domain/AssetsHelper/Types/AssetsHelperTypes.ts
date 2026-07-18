export interface AlignOrientationProperties {
    Name: string;
    Parent: BasePart;
    Enabled?: boolean;
    Mode?: Enum.OrientationAlignmentMode;
    AlignType?: Enum.AlignType;
    ReactionTorqueEnabled?: boolean;
    RigidityEnabled?: boolean;
    Attachment0?: Attachment;
    Attachment1?: Attachment;
    MaxAngularVelocity?: number;
    MaxTorque?: number;
    Responsiveness?: number;
    DeleteAttachmentsOnDestroy?: boolean;
}

export interface LinearVelocityProperties {
    Name: string;
    Parent: BasePart;
    Enabled?: boolean;
    Attachment0?: Attachment;
    Attachment1?: Attachment;
    DeleteAttachmentsOnDestroy?: boolean;
    ForceLimitMode?: Enum.ForceLimitMode;
    MaxForce?: number;
    ForceLimitsEnabled?: boolean;
    RelativeTo?: Enum.ActuatorRelativeTo;
    VelocityConstraintMode?: Enum.VelocityConstraintMode;

    VectorVelocity?: Vector3;

    LineDirection?: Vector3;
    LineVelocity?: number;

    PlaneVelocity?: Vector2;
    PrimaryTangentAxis?: Vector3;
    SecondaryTangentAxis?: Vector3;
}
