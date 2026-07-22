import { IStats } from "shared/Types/Database/PlayerData";

export type RuntimeStatsState = {
    stats: IStats;
    config: {
        strengthGainCooldown: number;
    };
};
