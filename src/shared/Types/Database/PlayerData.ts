export interface IStats {
    [`strength`]: number;
    [`wins`]: number;
    [`experience`]: number;
    [`rebirths`]: number;
}

export interface ISettings {
    [`musicVolume`]: number;
    [`effectsVolume`]: number;
    [`masterVolume`]: number;
}

export interface IProfileSettings {
    [`version`]: number;
}

export interface IUpgrade {
    [`level`]: number;
}

export interface IUpgrades {
    [`walkSpeed`]: IUpgrade;
    [`throwRate`]: IUpgrade;
    [`trainingRate`]: IUpgrade;
}

export interface IBoost {
    [`level`]: number;
}

export interface IBoosts {
    [`damage`]: IBoost;
    [`wins`]: IBoost;
    [`luck`]: IBoost;
}

export interface IProgression {
    [`stats`]: IStats;

    [`upgrades`]: IUpgrades;
    [`boosts`]: IBoosts;
}

export interface IPetStat {
    [`name`]: string;
    [`value`]: number;
}

export interface IPetModifier {
    [`name`]: string;
    [`_type`]: string;
}

export interface IPet {
    [`id`]: string;
    [`name`]: string;

    [`signs`]: string[];
    [`tags`]: string[];
    [`mutation`]: string;
    [`modifiers`]: IPetModifier[];
}

export interface IEquipment {
    [`weapon`]: number;
    [`pets`]: string[];
    [`title`]: number;
    [`aura`]: number;
}

export interface IInventory {
    [`pets`]: IPet[];
}

export interface IGamePass {
    [`name`]: string;
}

export interface IDevProduct {
    [`name`]: string;
    [`counter`]: number;
}

export interface IDonation {
    [`gamePasses`]: IGamePass[];
    [`devProducts`]: IDevProduct[];
}

export interface IPetIndex {
    [`name`]: string;
    [`mutation`]: string;
}

export interface IOpenedEgg {
    [`name`]: string;
    [`value`]: number;
}

export interface ICounters {
    [`robuxSpent`]: number;
    [`playTime`]: number;

    [`stats`]: IStats;

    [`openedEggs`]: IOpenedEgg[];
    [`petsIndex`]: IPetIndex[];
}

export interface PlayerData {
    [`progression`]: IProgression;
    [`equipment`]: IEquipment;
    [`inventory`]: IInventory;

    [`counters`]: ICounters;
    [`donation`]: IDonation;

    [`flags`]: Record<string, any>;
    [`settings`]: ISettings;

    [`profileSettings`]: IProfileSettings;
}
