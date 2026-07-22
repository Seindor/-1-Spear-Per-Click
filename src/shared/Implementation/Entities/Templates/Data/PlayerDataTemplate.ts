import { DataStoreDefinition } from "shared/Types/Database/DataStoreTypes";
import { PlayerData } from "shared/Types/Database/PlayerData";

export const PlayerDataTemplate: PlayerData = {
    progression: {
        stats: {
            strength: 0,
            wins: 0,
            experience: 0,
            rebirths: 0,
        },

        upgrades: {
            walkSpeed: {
                level: 0,
            },

            throwRate: {
                level: 0,
            },

            trainingRate: {
                level: 0,
            },
        },

        boosts: {
            damage: {
                level: 0,
            },

            wins: {
                level: 0,
            },

            luck: {
                level: 0,
            },
        },
    },

    equipment: {
        weapon: 1,
        pets: [],
        title: 0,
        aura: 0,
    },

    inventory: {
        pets: [],
    },

    counters: {
        robuxSpent: 0,
        playTime: 0,

        stats: {
            strength: 0,
            wins: 0,
            experience: 0,
            rebirths: 0,
        },

        openedEggs: [],
        petsIndex: [],
    },

    donation: {
        gamePasses: [],
        devProducts: [],
    },

    flags: {},

    settings: {
        masterVolume: 1,
        musicVolume: 1,
        effectsVolume: 1,
    },

    profileSettings: {
        version: 1.0,
    },
};

export const PlayersDataDefinition: DataStoreDefinition<`PlayersData`> = {
    name: `PlayersData`,
    storeName: `PlayersData`,
    templateName: `PlayerData`,
    template: PlayerDataTemplate,
};
