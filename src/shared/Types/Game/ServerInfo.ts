export interface ServerInfo {
    owner: string;

    createdAt: number;
    jobId: string;
    placeId: number;
    accessCode?: string;

    firstName: string;
    secondName: string;

    continent_code: string;
    countryCode: string;
    region: string;
    regionName: string;

    players: number;
    maxPlayers: number;

    locked: boolean;
    visibility: `Public` | `Private`;
}

export type ServerName = {
    firstName: string;
    secondName: string;
};

export const PlaceIds = {
    [`Main Menu`]: 110136027700508,
    [`Main Game`]: 120818730416761,
} as const;

export const PlaceNames = {
    [PlaceIds[`Main Menu`]]: `Main Menu`,
    [PlaceIds["Main Game"]]: `Main Game`,
} as const;

export const Teleports = {
    [`Main Menu`]: PlaceIds[`Main Game`],
    [`Main Game`]: PlaceIds[`Main Game`],
};

export type PlaceBlacklist = Array<keyof typeof PlaceIds>;

export function IsPlaceBlacklisted(blackList: Array<keyof typeof PlaceIds>): boolean {
    const currentPlaceId = game.PlaceId;

    return blackList.some((placeName) => PlaceIds[placeName] === currentPlaceId);
}
