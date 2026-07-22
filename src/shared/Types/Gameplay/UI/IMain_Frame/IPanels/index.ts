import { IEgg_Hatch } from "./IEgg_Hatch";
import { IPets } from "./IPets";
import { IRebirth } from "./IRebirth";

export type IPanels = {
    ["Egg_Hatch"]: IEgg_Hatch;
    ["Pets"]: IPets;
    ["Rebirth"]: IRebirth;
} & Frame;
