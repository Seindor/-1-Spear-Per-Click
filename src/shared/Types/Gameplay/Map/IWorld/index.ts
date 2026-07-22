export type IWorld = {
    ["Building"]: Folder;
    ["MainParts"]: {
        ["Rooms"]: Folder;
        ["Rooms_Spawn"]: Part;
        ["Spawn"]: {
            ["Decal"]: Decal;
        } & SpawnLocation;
    } & Folder;
} & Folder;
