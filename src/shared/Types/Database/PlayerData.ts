import { CCGClans, GhoulClans } from "./Clan";
import { IFactionData } from "./Faction";
import { Gender } from "./Gender";
import { IHotbarSlot } from "./Hotbar";
import { IItemDefinition, IItemStack } from "./Item";
import { IKeybinds } from "./Keybinds";
import { IQuestData } from "./Quest";
import { Race } from "./Race";
import { ITalentData } from "./Talent";

export interface ISlotData {
    slotInfo: ISlotInfo;
    slotVersion: number;

    flags: Record<string, boolean | number | string>;
    counters: Record<string, number>;

    statistics: IStatistics;

    character: ICharacterData;
}

export interface ICharacterData {
    profile: IProfileData;

    stats: IStatsData;

    status: IStatusData;

    world: IWorldData;

    reputation: Record<string, number>;

    faction: IFactionData;

    collections: ICollectionsData;
    storage: string[];

    flags: Record<string, boolean | number | string>;
    counters: Record<string, number>;

    progression: IProgressionData;

    equipment: IEquipmentData;

    inventory: IInventoryData;

    talents: ITalentData[];

    quests: IQuestData[];
}

export type ISlotRecievedInfo = `Robux` | `Free` | `Gift` | `GhoulPoints` | `Tester` | `Other`;

export interface ISlotInfo {
    recievedFrom: ISlotRecievedInfo;
    slotId: string;
    setuped: boolean;
    createdAt: number;
    lastPlayed: number;
    playTime: number;
}

export interface IStatistics {
    wipes: number;

    totalDeaths: number;
    totalKills: number;
    totalNpcKills: number;

    highestLevel: number;

    totalPlayTime: number;

    questStatistics: Record<string, IQuestData>;
}

export interface IProfileData {
    name: string;
    clan: GhoulClans | CCGClans;
    race: Race;
    gender: Gender;
    currencies: ICurrencies;
}

export interface ICurrencies {
    yens: number;
    rcCells: number;
    ghoulPoints: number;
}

export interface IStatsData {
    strength: number;
    vitality: number;
    agility: number;
}

export interface IStatusData {
    health: number;
    hunger: number;
}

export interface IWorldData {
    lastPosition?: Vector3;
    region?: string;
    spawnId?: string;
}

export interface IProgressionData {
    level: number;
    experience: number;
    lives: number;
}

export interface IEquipmentData {
    appearance: IAppearanceData;
    clothing: {
        shirt: {
            name: string;
            id?: string;
        };
        pants: {
            name: string;
            id?: string;
        };
    };
    fightingStyle: string;
    weapon: string;
    hotbar: IHotbarSlot[];
}

export interface IAppearanceData {
    hat?: {
        id: string;
        vanity: boolean;
    };
    face?: {
        id: string;
        vanity: boolean;
    };
    mouth?: {
        id: string;
        vanity: boolean;
    };
    body?: {
        id: string;
        vanity: boolean;
    };
    legs?: {
        id: string;
        vanity: boolean;
    };
    back?: {
        id: string;
        vanity: boolean;
    };
}

export interface IInventoryData {
    items: IItemStack[];

    capacity: number;
}

export interface ICollectionsData {
    forms: string[];
    recipes: string[];

    masks: string[];

    titles: string[];

    achievements: string[];

    emotes: string[];
}

export interface PlayerData {
    version: number;
    currentSlot: string;

    availableRaces: Race[];
    slots: ISlotData[];

    account: {
        joinedAt: number;

        redeemedCodes: Record<string, number>;

        receivedGroupReward: boolean;

        discordVerified: boolean;

        tester: boolean;
    };

    currencies: {
        wipePoints: number;
    };

    bank: Record<number, IItemStack | undefined>;

    upgrades: Record<string, boolean>;

    purchases: {
        gamepasses: string[];

        products: Record<string, number>;
    };

    settings: {
        masterVolume: number;
        musicVolume: number;
        effectsVolume: number;

        keybinds: Record<string, IKeybinds>;
    };
}
