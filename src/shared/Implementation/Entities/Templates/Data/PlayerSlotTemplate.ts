import { HttpService } from "@rbxts/services";

import { ISlotData } from "shared/Types/Database/PlayerData";

export function CreatePlayerSlotTemplate(): ISlotData {
    return {
        slotInfo: {
            recievedFrom: "Free",
            slotId: `${HttpService.GenerateGUID(false)}_${os.time()}_${math.random(1, 9999999)}`,
            setuped: false,
            createdAt: os.time(),
            lastPlayed: 0,
            playTime: 0,
        },

        slotVersion: 1,
        flags: {},
        counters: {},

        statistics: {
            wipes: 0,
            totalDeaths: 0,
            totalKills: 0,
            totalNpcKills: 0,
            highestLevel: 0,
            totalPlayTime: 0,
            questStatistics: {},
        },

        character: {
            profile: {
                name: "",
                clan: "Kaneki",
                race: "Ghoul",
                gender: "Male",
                currencies: {
                    yens: 0,
                    rcCells: 0,
                    ghoulPoints: 0,
                },
            },

            stats: {
                strength: 0,
                vitality: 0,
                agility: 0,
            },

            status: {
                health: 100,
                hunger: 100,
            },

            world: {},
            reputation: {},

            faction: {
                id: "Civilian",
                rank: 1,
            },

            collections: {
                forms: [],
                recipes: [],
                masks: [],
                titles: [],
                achievements: [],
                emotes: [],
            },

            storage: [],

            flags: {},
            counters: {},

            progression: {
                level: 1,
                experience: 0,
                lives: 3,
            },

            equipment: {
                appearance: {},
                clothing: {
                    shirt: {
                        name: `Default`,
                    },
                    pants: {
                        name: `Default`,
                    },
                },
                fightingStyle: "Fists",
                weapon: "none",
                hotbar: [],
            },

            inventory: {
                items: [],
                capacity: 100,
            },

            talents: [],
            quests: [],
        },
    };
}
