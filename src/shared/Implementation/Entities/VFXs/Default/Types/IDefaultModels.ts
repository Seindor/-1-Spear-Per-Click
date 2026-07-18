export type IDefaultModels = {
    ["Models"]: {
        ["AfterImageCharacter"]: {
            ["Head"]: {
                ["Mesh"]: SpecialMesh;
            } & Part;
            ["Left Arm"]: Part;
            ["Left Leg"]: Part;
            ["Right Arm"]: Part;
            ["Right Leg"]: Part;
            ["Torso"]: Part;
        } & Model;
    } & Folder;
} & Folder;
