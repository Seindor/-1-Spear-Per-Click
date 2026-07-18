import { RunService } from "@rbxts/services";
import ProfileStore from "@rbxts/profile-store";

import { DataProfileAggregate, ProfileLike } from "../Aggregates/DataProfileAggregate";

import { DataStoreAggregate } from "../Aggregates/DataStoreAggregate";

import { DataStoreDefinitions } from "../Components/DataStoreDefinitions";
import { DataTemplates } from "shared/Implementation/Entities/Templates/Data/DataTemplates";

import {
    DataStoreData,
    DataStoreDataMap,
    DataStoreName,
    DataTemplateName,
    LoadProfileOptions,
    ProfileKey,
} from "../../../../shared/Types/Database/DataStoreTypes";

type AnyProfileAggregate = DataProfileAggregate<unknown>;

type StoreLike<TData> = {
    StartSessionAsync(
        key: string,
        options?: {
            Cancel?: () => boolean;
            Steal?: boolean;
        },
    ): ProfileLike<TData> | undefined;

    RemoveAsync(key: string): boolean;
};

export class DataStoreService {
    private readonly stores = new Map<DataStoreName, unknown>();
    private readonly profiles = new Map<DataStoreName, Map<ProfileKey, AnyProfileAggregate>>();
    private readonly dataStoreAggregates = new Map<DataStoreName, unknown>();

    public constructor() {
        this.CreateStores();
        this.CreateDataStoreAggregates();
    }

    private CreateStores() {
        for (const [storeName, definition] of pairs(DataStoreDefinitions)) {
            const actualStoreName = RunService.IsStudio()
                ? `${definition.storeName}_Studio`
                : definition.storeName;

            const store = ProfileStore.New(actualStoreName, definition.template);

            this.stores.set(storeName as DataStoreName, store);
            this.profiles.set(storeName as DataStoreName, new Map());
        }
    }

    private CreateDataStoreAggregates() {
        for (const [storeName] of pairs(DataStoreDefinitions)) {
            const aggregate = new DataStoreAggregate(storeName as DataStoreName, this);

            this.dataStoreAggregates.set(storeName as DataStoreName, aggregate);
        }
    }

    private GetTemplate(templateName: DataTemplateName) {
        const template = DataTemplates[templateName];

        if (!template) {
            error(`Data template "${templateName}" does not exist.`);
        }

        return template;
    }

    private RemoveProfileFromCache(storeName: DataStoreName, key: ProfileKey) {
        this.profiles.get(storeName)?.delete(key);
    }

    public GetDataStore<TStoreName extends DataStoreName>(
        storeName: TStoreName,
    ): DataStoreAggregate<TStoreName> {
        const dataStore = this.dataStoreAggregates.get(storeName);

        if (!dataStore) {
            error(`DataStore "${storeName}" does not exist.`);
        }

        return dataStore as DataStoreAggregate<TStoreName>;
    }

    public LoadProfile<TStoreName extends DataStoreName>(
        storeName: TStoreName,
        key: ProfileKey,
        options?: LoadProfileOptions,
    ): DataProfileAggregate<DataStoreDataMap[TStoreName]> | undefined {
        const profileKey = key;

        const existingProfile = this.GetProfile(storeName, profileKey);

        if (existingProfile) {
            return existingProfile;
        }

        const store = this.stores.get(storeName) as
            | StoreLike<DataStoreDataMap[TStoreName]>
            | undefined;

        if (!store) {
            warn(`DataStore "${storeName}" does not exist.`);
            return undefined;
        }

        const sessionOptions =
            options?.cancel !== undefined
                ? {
                      Cancel: options.cancel,
                  }
                : undefined;

        const profile = store.StartSessionAsync(profileKey, sessionOptions);

        if (!profile) {
            warn(`Failed to load profile "${storeName}:${profileKey}".`);
            return undefined;
        }

        const definition = DataStoreDefinitions[storeName];

        const aggregate = new DataProfileAggregate<DataStoreDataMap[TStoreName]>(
            storeName,
            profileKey,
            definition.templateName,
            profile,
            () => this.WipeProfile(storeName, profileKey),
            () => this.RemoveProfileFromCache(storeName, profileKey),
            (templateName) => this.GetTemplate(templateName),
        );

        if (options?.userId !== undefined) {
            aggregate.AddUserId(options.userId);
        }

        aggregate.Reconcile();

        aggregate.OnSessionEnd(() => {
            this.RemoveProfileFromCache(storeName, profileKey);
            options?.onSessionEnd?.();
        });

        this.profiles.get(storeName)!.set(profileKey, aggregate as AnyProfileAggregate);

        return aggregate;
    }

    public GetProfile<TStoreName extends DataStoreName>(
        storeName: TStoreName,
        key: ProfileKey,
    ): DataProfileAggregate<DataStoreDataMap[TStoreName]> | undefined {
        return this.profiles.get(storeName)?.get(key) as
            | DataProfileAggregate<DataStoreDataMap[TStoreName]>
            | undefined;
    }

    public GetProfileData<TStoreName extends DataStoreName>(
        storeName: TStoreName,
        key: ProfileKey,
    ): DataStoreData<TStoreName> | undefined {
        return this.GetProfile(storeName, key)?.GetData();
    }

    public HasProfile(storeName: DataStoreName, key: ProfileKey): boolean {
        return this.profiles.get(storeName)?.has(key) ?? false;
    }

    public ReleaseProfile(storeName: DataStoreName, key: ProfileKey) {
        const profile = this.GetProfile(storeName, key);

        if (!profile) {
            return;
        }

        profile.Release();
    }

    public WipeProfile<TStoreName extends DataStoreName>(
        storeName: TStoreName,
        key: ProfileKey,
    ): boolean {
        const activeProfile = this.GetProfile(storeName, key);

        if (activeProfile) {
            activeProfile.Release();
        }

        const store = this.stores.get(storeName) as
            | StoreLike<DataStoreDataMap[TStoreName]>
            | undefined;

        if (!store) {
            warn(`DataStore "${storeName}" does not exist.`);
            return false;
        }

        const success = store.RemoveAsync(key);

        if (!success) {
            warn(`Failed to wipe profile "${storeName}:${key}".`);
        }

        return success;
    }

    public ReleaseAllProfilesFromStore(storeName: DataStoreName) {
        const profiles = this.profiles.get(storeName);

        if (!profiles) {
            return;
        }

        const profileList = new Array<AnyProfileAggregate>();

        for (const [, profile] of profiles) {
            profileList.push(profile);
        }

        for (const profile of profileList) {
            profile.Release();
        }
    }

    public ReleaseAllProfiles() {
        for (const [storeName] of this.profiles) {
            this.ReleaseAllProfilesFromStore(storeName);
        }
    }
}
