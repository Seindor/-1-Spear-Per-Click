import { Players } from "@rbxts/services";

import { DataStoreAggregate } from "../Aggregates/DataStoreAggregate";
import { DataStoreService } from "../Services/DataStoreService";

import {
    DataStoreData,
    DataStoreDataMap,
    DataStoreName,
    LoadProfileOptions,
    ProfileKey,
} from "shared/Types/Database/DataStoreTypes";

export class DataStoreAPI {
    private readonly service = new DataStoreService();

    public GetDataStore<TStoreName extends DataStoreName>(
        storeName: TStoreName,
    ): DataStoreAggregate<TStoreName> {
        return this.service.GetDataStore(storeName);
    }

    public LoadProfile<TStoreName extends DataStoreName>(
        storeName: TStoreName,
        key: ProfileKey | number,
        options?: LoadProfileOptions,
    ) {
        return this.service.LoadProfile(storeName, tostring(key), options);
    }

    public GetProfile<TStoreName extends DataStoreName>(
        storeName: TStoreName,
        key: ProfileKey | number,
    ) {
        return this.service.GetProfile(storeName, tostring(key));
    }

    public GetProfileData<TStoreName extends DataStoreName>(
        storeName: TStoreName,
        key: ProfileKey | number,
    ): DataStoreData<TStoreName> | undefined {
        return this.service.GetProfileData(storeName, tostring(key));
    }

    public ReleaseProfile(storeName: DataStoreName, key: ProfileKey | number) {
        this.service.ReleaseProfile(storeName, tostring(key));
    }

    public WipeProfile(storeName: DataStoreName, key: ProfileKey | number): boolean {
        return this.service.WipeProfile(storeName, tostring(key));
    }

    public ReleaseAllProfiles() {
        this.service.ReleaseAllProfiles();
    }

    public GetPlayerKey(playerOrUserId: Player | number | string): string {
        if (typeIs(playerOrUserId, "string")) {
            return playerOrUserId;
        }

        if (typeIs(playerOrUserId, "number")) {
            return tostring(playerOrUserId);
        }

        return tostring(playerOrUserId.UserId);
    }

    public LoadPlayerProfile(player: Player, options?: Omit<LoadProfileOptions, "userId">) {
        const key = this.GetPlayerKey(player);

        return this.LoadProfile("PlayersData", key, {
            ...options,
            userId: player.UserId,
            cancel: options?.cancel ?? (() => !player.IsDescendantOf(Players)),
        });
    }

    public GetPlayerProfile(playerOrUserId: Player | number | string) {
        return this.GetProfile("PlayersData", this.GetPlayerKey(playerOrUserId));
    }

    public GetPlayerData(
        playerOrUserId: Player | number | string,
    ): DataStoreDataMap["PlayersData"] | undefined {
        return this.GetProfileData("PlayersData", this.GetPlayerKey(playerOrUserId));
    }

    public ReleasePlayerProfile(playerOrUserId: Player | number | string) {
        this.ReleaseProfile("PlayersData", this.GetPlayerKey(playerOrUserId));
    }

    public WipePlayerProfile(playerOrUserId: Player | number | string): boolean {
        return this.WipeProfile("PlayersData", this.GetPlayerKey(playerOrUserId));
    }
}
