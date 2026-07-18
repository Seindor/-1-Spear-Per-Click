export const enum Faction {
    Civilian = "Civilian",
    CCG = "CCG",
    Aogiri = "Aogiri",
}

export interface IFactionData {
    id?: keyof typeof Faction;

    rank?: number;
}
