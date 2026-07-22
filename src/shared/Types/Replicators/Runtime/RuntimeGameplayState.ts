export type IRuntimeGamePlayWall = {
    [`health`]: number;
    [`maxHealth`]: number;
};

export type IRuntimeGamePlayRoom = Array<IRuntimeGamePlayWall>;

export type IRuntimeGamePlayWorld = {
    [`id`]: number;
    [`rooms`]: Array<IRuntimeGamePlayRoom>;
    [`completedRooms`]: number[];
};

export type RuntimeGamePlayState = {
    [`World`]: IRuntimeGamePlayWorld;
};
