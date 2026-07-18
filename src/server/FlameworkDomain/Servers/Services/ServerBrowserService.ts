import { MemoryStoreService } from "@rbxts/services";
import { Service } from "@flamework/core";

import { ServersSortedMapKey } from "server/Types/Game/ServerInfo";
import { MemoryStoreEntry } from "shared/Types/Game/MemoryStore";
import { ServerInfo } from "shared/Types/Game/ServerInfo";

@Service()
export class ServerBrowserService {
    private maps = new Map<number, MemoryStoreSortedMap>();

    private getMap(placeId: number) {
        let map = this.maps.get(placeId);

        if (!map) {
            map = MemoryStoreService.GetSortedMap(`${placeId}_${ServersSortedMapKey}`);
            this.maps.set(placeId, map);
        }

        return map;
    }

    public GetServers(placeId: number): ServerInfo[] {
        const map = this.getMap(placeId);
        const result: ServerInfo[] = [];

        const [success, entries] = pcall(() => {
            return map.GetRangeAsync(Enum.SortDirection.Descending, 200);
        });

        if (!success || !entries) {
            warn("[ServerBrowserService] MemoryStore failed");
            return [];
        }

        for (const entry of entries as MemoryStoreEntry<ServerInfo>[]) {
            const info = entry?.value;

            if (!info || typeOf(info) !== "table") continue;

            // strict validation (IMPORTANT for RemoteFunction safety)
            if (!info.jobId || !info.placeId) continue;
            if (info.visibility !== "Public") continue;
            if (info.locked === true) continue;

            result.push({
                owner: tostring(info.owner),

                createdAt: tonumber(info.createdAt) ?? 0,
                jobId: tostring(info.jobId),
                placeId: tonumber(info.placeId) ?? 0,

                firstName: tostring(info.firstName),
                secondName: tostring(info.secondName),

                accessCode: tostring(info.accessCode),
                continent_code: tostring(info.continent_code ?? "UN"),
                countryCode: tostring(info.countryCode ?? "UN"),
                region: tostring(info.region ?? "Unknown"),
                regionName: tostring(info.regionName ?? "Unknown"),

                players: tonumber(info.players) ?? 0,
                maxPlayers: tonumber(info.maxPlayers) ?? 0,

                locked: false,
                visibility: "Public",
            });
        }

        return result;
    }
}
