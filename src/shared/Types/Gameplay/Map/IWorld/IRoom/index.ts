import { IHitboxes } from "./IHitboxes";
import { IMainParts } from "./IMainParts";

export type IRoom = {
    ["Building"]: Folder;
    [`Walls`]: Folder;
    ["Hitboxes"]: IHitboxes;
    ["MainParts"]: IMainParts;
    ["SUPER_VIP_ZONE"]: {
        ["HIRBOX"]: Part;
        ["SUPER_VIP_ZONE_FADE"]: {
            ["Beam"]: {
                ["Back"]: {
                    ["Frame"]: {
                        ["UIGradient"]: UIGradient;
                    } & Frame;
                } & SurfaceGui;
                ["Front"]: {
                    ["Frame"]: {
                        ["UIGradient"]: UIGradient;
                    } & Frame;
                } & SurfaceGui;
            } & Part;
        } & Model;
        ["SUPER_VIP_ZONE_REWARD"]: {
            ["SurfaceGui"]: {
                ["SIGN"]: {
                    ["UIGradient"]: UIGradient;
                    ["UIStroke"]: UIStroke;
                } & TextLabel;
            } & SurfaceGui;
        } & Part;
        ["SUPER_VIP_ZONE_TITLE"]: {
            ["SurfaceGui"]: {
                ["SIGN"]: {
                    ["UIGradient"]: UIGradient;
                    ["UIStroke"]: UIStroke;
                } & TextLabel;
            } & SurfaceGui;
        } & Part;
    } & Model;
    ["SuperWins_Pad"]: {
        ["Beam"]: {
            ["Back"]: {
                ["Frame"]: {
                    ["UIGradient"]: UIGradient;
                } & Frame;
            } & SurfaceGui;
            ["Front"]: {
                ["Frame"]: {
                    ["UIGradient"]: UIGradient;
                } & Frame;
            } & SurfaceGui;
            ["Left"]: {
                ["Frame"]: {
                    ["UIGradient"]: UIGradient;
                } & Frame;
            } & SurfaceGui;
            ["Right"]: {
                ["Frame"]: {
                    ["UIGradient"]: UIGradient;
                } & Frame;
            } & SurfaceGui;
        } & Part;
        ["Billboard_Part"]: {
            ["BillboardGui"]: {
                ["Amount_Title"]: {
                    ["UIStroke"]: UIStroke;
                } & TextLabel;
            } & BillboardGui;
        } & Part;
        ["Neon"]: Part;
        ["Part1"]: Part;
        ["Part3"]: Part;
        ["Part4"]: Part;
        ["Part5"]: Part;
    } & Model;
    ["VIP_ZONE"]: {
        ["HITBOX"]: Part;
        ["VIP_ZONE_FADE"]: {
            ["Beam"]: {
                ["Back"]: {
                    ["Frame"]: {
                        ["UIGradient"]: UIGradient;
                    } & Frame;
                } & SurfaceGui;
                ["Front"]: {
                    ["Frame"]: {
                        ["UIGradient"]: UIGradient;
                    } & Frame;
                } & SurfaceGui;
            } & Part;
        } & Model;
        ["VIP_ZONE_REWARD"]: {
            ["SurfaceGui"]: {
                ["SIGN"]: {
                    ["UIGradient"]: UIGradient;
                    ["UIStroke"]: UIStroke;
                } & TextLabel;
            } & SurfaceGui;
        } & Part;
        ["VIP_ZONE_TITLE"]: {
            ["SurfaceGui"]: {
                ["SIGN"]: {
                    ["UIStroke"]: UIStroke;
                } & TextLabel;
            } & SurfaceGui;
        } & Part;
    } & Model;
    ["Wins_Pad"]: {
        ["Beam"]: {
            ["Back"]: {
                ["Frame"]: {
                    ["UIGradient"]: UIGradient;
                } & Frame;
            } & SurfaceGui;
            ["Front"]: {
                ["Frame"]: {
                    ["UIGradient"]: UIGradient;
                } & Frame;
            } & SurfaceGui;
            ["Left"]: {
                ["Frame"]: {
                    ["UIGradient"]: UIGradient;
                } & Frame;
            } & SurfaceGui;
            ["Right"]: {
                ["Frame"]: {
                    ["UIGradient"]: UIGradient;
                } & Frame;
            } & SurfaceGui;
        } & Part;
        ["Billboard_Part"]: {
            ["BillboardGui"]: {
                ["Amount_Title"]: {
                    ["UIStroke"]: UIStroke;
                } & TextLabel;
            } & BillboardGui;
        } & Part;
        ["Neon"]: Part;
        ["Part1"]: Part;
        ["Part3"]: Part;
        ["Part4"]: Part;
        ["Part5"]: Part;
    } & Model;
} & Model;
