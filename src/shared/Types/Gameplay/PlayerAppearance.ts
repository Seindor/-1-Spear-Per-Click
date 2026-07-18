export type IAppearance = {
    ["Arms"]: Folder;
    ["Back"]: Folder;
    ["Face"]: Folder;
    ["Handlers"]: {
        ["Motors"]: Folder;
        ["Parts"]: Folder;
    } & Folder;
    ["Hat"]: Folder;
    ["Legs"]: Folder;
    ["Others"]: Folder;
    ["Torso"]: Folder;
    ["Weapon"]: {
        ["Models"]: Folder;
        ["Welds"]: Folder;
    } & Folder;
} & Folder;
