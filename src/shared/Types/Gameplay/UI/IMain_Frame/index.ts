import { IBoosts } from "./IBoosts";
import { ILevel_Bar } from "./ILevelBar";
import { IMain_Buttons } from "./IMain_Buttons";
import { IMisc_Buttons } from "./IMisc_Buttons";
import { IPanels } from "./IPanels";
import { IProducts_Buttons } from "./IProduct_Buttons";
import { IStats_Counters } from "./IStats_Counters";
import { ITop_Buttons } from "./ITop_Buttons";
import { ITitle } from "./Misc_Types/ITitle";

export type IMain_Frame = {
    [`Boosts`]: IBoosts;
    [`Level_Bar`]: ILevel_Bar;
    [`Main_Buttons`]: IMain_Buttons;
    [`Misc_Buttons`]: IMisc_Buttons;
    [`Panels`]: IPanels;
    [`Products_Buttons`]: IProducts_Buttons;
    [`Stats_Counters`]: IStats_Counters;
    [`Top_Buttons`]: ITop_Buttons;
    [`Power_Title`]: ITitle;
    [`Reibrth_Needed_Title`]: ITitle;
    [`Stat_Title`]: ITitle;
} & Frame;
