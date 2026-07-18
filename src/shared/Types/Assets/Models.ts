export type IModels = {
    ["Default"]: {
        ["Models"]: {
            ["AfterImageCharacter"]: {
                ["Head"]: {
                    ["FaceCenterAttachment"]: Attachment;
                    ["FaceFrontAttachment"]: Attachment;
                    ["HairAttachment"]: Attachment;
                    ["HatAttachment"]: Attachment;
                    ["Mesh"]: SpecialMesh;
                    ["Snap"]: Snap;
                    ["Snap"]: Snap;
                } & Part;
                ["Left Arm"]: {
                    ["LeftGripAttachment"]: Attachment;
                    ["LeftShoulderAttachment"]: Attachment;
                    ["Weld"]: Weld;
                } & Part;
                ["Left Leg"]: {
                    ["LeftFootAttachment"]: Attachment;
                    ["Snap"]: Snap;
                } & Part;
                ["Right Arm"]: {
                    ["RightGripAttachment"]: Attachment;
                    ["RightShoulderAttachment"]: Attachment;
                } & Part;
                ["Right Leg"]: {
                    ["RightFootAttachment"]: Attachment;
                    ["Snap"]: Snap;
                    ["Snap"]: Snap;
                    ["Snap"]: Snap;
                } & Part;
                ["Torso"]: {
                    ["BodyBackAttachment"]: Attachment;
                    ["BodyFrontAttachment"]: Attachment;
                    ["Left Hip"]: Motor6D;
                    ["Left Shoulder"]: Motor6D;
                    ["LeftCollarAttachment"]: Attachment;
                    ["Neck"]: Motor6D;
                    ["NeckAttachment"]: Attachment;
                    ["Right Hip"]: Motor6D;
                    ["Right Shoulder"]: Motor6D;
                    ["RightCollarAttachment"]: Attachment;
                    ["Snap"]: Snap;
                    ["Snap"]: Snap;
                    ["Snap"]: Snap;
                    ["WaistBackAttachment"]: Attachment;
                    ["WaistCenterAttachment"]: Attachment;
                    ["WaistFrontAttachment"]: Attachment;
                    ["Weld"]: Weld;
                    ["Weld"]: Weld;
                    ["Weld"]: Weld;
                    ["Weld"]: Weld;
                    ["Weld"]: Weld;
                    ["Weld"]: Weld;
                    ["Weld"]: Weld;
                    ["Weld"]: Weld;
                    ["Weld"]: Weld;
                    ["Weld"]: Weld;
                    ["Weld"]: Weld;
                    ["Weld"]: Weld;
                    ["Weld"]: Weld;
                    ["Weld"]: Weld;
                    ["Weld"]: Weld;
                    ["Weld"]: Weld;
                    ["Weld"]: Weld;
                    ["Weld"]: Weld;
                    ["Weld"]: Weld;
                    ["Weld"]: Weld;
                    ["Weld"]: Weld;
                    ["Weld"]: Weld;
                    ["Weld"]: Weld;
                } & Part;
            } & Model;
        } & Folder;
    } & Folder;
    ["Sekiro"]: {
        ["Models"]: {
            ["Katana"]: {
                ["SurfaceAppearance"]: SurfaceAppearance;
            } & MeshPart;
            ["Prosthesis"]: {
                ["LeftCharArm"]: {
                    ["Body"]: {
                        ["WeldConstraint"]: WeldConstraint;
                    } & MeshPart;
                    ["WeldConstraint"]: WeldConstraint;
                } & MeshPart;
                ["SurfaceAppearance"]: SurfaceAppearance;
            } & MeshPart;
            ["Sheath"]: {
                ["SurfaceAppearance"]: SurfaceAppearance;
            } & MeshPart;
        } & Folder;
        ["Welds"]: {
            ["Left Arm_Prothesis_Weld"]: Weld;
            ["RH_Katana_Weld"]: Weld;
            ["Sheath_Katana_Weld"]: Weld;
            ["Torso_Sheath_Weld"]: Weld;
        } & Folder;
    } & Folder;
} & Folder;
