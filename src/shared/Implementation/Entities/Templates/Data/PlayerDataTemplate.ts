import { DataStoreDefinition } from "shared/Types/Database/DataStoreTypes";

import { PlayerData } from "shared/Types/Database/PlayerData";

export const PlayerDataTemplate: PlayerData = {
    version: 1,

    currentSlot: `none`,

    availableRaces: ["Ghoul", "Human"],
    slots: [],

    account: {
        joinedAt: os.time(),

        redeemedCodes: {},

        receivedGroupReward: false,

        discordVerified: false,

        tester: false,
    },

    currencies: {
        wipePoints: 0,
    },

    bank: {
        [1]: undefined,
        [2]: undefined,
        [3]: undefined,
    },

    upgrades: {},

    purchases: {
        gamepasses: [],

        products: {},
    },

    settings: {
        masterVolume: 1,
        musicVolume: 1,
        effectsVolume: 1,

        keybinds: {
            MainInputs: {
                M1: {
                    inputTypes: ["MouseButton1"],
                },

                M2: {
                    inputTypes: ["MouseButton2"],
                },

                Critical: {
                    inputTypes: ["R"],
                },

                Block: {
                    inputTypes: ["F"],
                },

                Equip: {
                    inputTypes: ["E"],
                },

                Interact: {
                    inputTypes: ["T"],
                },

                Dash: {
                    inputTypes: ["Q"],
                },

                Run: {
                    inputTypes: ["LeftShift"],
                },

                Control: {
                    inputTypes: [`LeftControl`],
                },
            },
            HotBar: {
                Slot_1: {
                    inputTypes: ["1"],
                },
                Slot_2: {
                    inputTypes: ["2"],
                },
                Slot_3: {
                    inputTypes: ["3"],
                },
                Slot_4: {
                    inputTypes: ["4"],
                },
                Slot_5: {
                    inputTypes: ["5"],
                },
                Slot_6: {
                    inputTypes: ["6"],
                },
                Slot_7: {
                    inputTypes: ["7"],
                },
                Slot_8: {
                    inputTypes: ["8"],
                },
                Slot_9: {
                    inputTypes: ["9"],
                },
                Slot_10: {
                    inputTypes: ["0"],
                },
                Slot_11: {
                    inputTypes: ["-"],
                },
                Slot_12: {
                    inputTypes: ["="],
                },
            },
        },
    },
};

export const PlayersDataDefinition: DataStoreDefinition<"PlayersData"> = {
    name: "PlayersData",
    storeName: "PlayersData",
    templateName: "PlayerData",
    template: PlayerDataTemplate,
};
