import { IWins_Counter } from "./IWins_Counter";

export type IStats_Counters = {
    ["UIListLayout"]: UIListLayout;
    ["UIScale"]: UIScale;
    ["Wins_Counter"]: IWins_Counter;
} & Frame;
