import { DataStoreService } from "../Services/DataStoreService";

import {
    DataStoreData,
    DataStoreName,
    LoadProfileOptions,
    ProfileKey,
} from "shared/Types/Database/DataStoreTypes";

export class DataStoreAggregate<TStoreName extends DataStoreName> {
    public readonly name: TStoreName;

    private readonly service: DataStoreService;

    public constructor(name: TStoreName, service: DataStoreService) {
        this.name = name;
        this.service = service;
    }

    public LoadProfile(key: ProfileKey | number, options?: LoadProfileOptions) {
        return this.service.LoadProfile(this.name, tostring(key), options);
    }

    public GetProfile(key: ProfileKey | number) {
        return this.service.GetProfile(this.name, tostring(key));
    }

    public GetProfileOrLoad(key: ProfileKey | number, options?: LoadProfileOptions) {
        const profileKey = tostring(key);
        const profile = this.GetProfile(profileKey);

        if (profile) {
            return profile;
        }

        return this.LoadProfile(profileKey, options);
    }

    public GetProfileData(key: ProfileKey | number): DataStoreData<TStoreName> | undefined {
        return this.service.GetProfileData(this.name, tostring(key));
    }

    public HasProfile(key: ProfileKey | number): boolean {
        return this.service.HasProfile(this.name, tostring(key));
    }

    public ReleaseProfile(key: ProfileKey | number) {
        this.service.ReleaseProfile(this.name, tostring(key));
    }

    public WipeProfile(key: ProfileKey | number): boolean {
        return this.service.WipeProfile(this.name, tostring(key));
    }

    public ReleaseAllProfiles() {
        this.service.ReleaseAllProfilesFromStore(this.name);
    }
}
