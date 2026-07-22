import { Dependency, Service } from "@flamework/core";

import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { ServerRegistry } from "server/DI/Generated/ServerRegistry";

import { CompositionRootShared } from "shared/DI/CompositionRootShared";
import { CompositionRootServer } from "server/DI/CompositionRootServer";

import type { PlayerData } from "shared/Types/Database/PlayerData";
import EventBusAggregate from "shared/Domain/EventBus/Aggregates/EventBusAggregate";
import { DataProfileAggregate } from "server/Domain/DataStore/Aggregates/DataProfileAggregate";

import { TableHelper } from "shared/Utilities/TableHelper";
import { DeepCloneComponent } from "shared/Domain/ReplicatedAtoms/Components/AtomPathAccessorComponent";

const sharedScope = CompositionRootShared.createScope();
const serverScope = CompositionRootServer.createScope();

export class DataHandler {
    private readonly playerStringId: string;

    private readonly dataStoreAPI = serverScope.resolve(ServerRegistry.Singletons.API.DataStoreAPI);
    private readonly eventBusAPI = sharedScope.resolve(SharedRegistry.Singletons.API.EventBusAPI);

    private readonly playerDataBus: EventBusAggregate;

    private profile?: DataProfileAggregate<PlayerData>;
    private data?: PlayerData;

    public constructor(private readonly player: Player) {
        this.playerStringId = tostring(player.UserId);
        this.playerDataBus = this.eventBusAPI.New(this.playerStringId, "PlayerData");
    }

    public Load(): boolean {
        const profile = this.dataStoreAPI.LoadProfile("PlayersData", this.playerStringId, {
            onSessionEnd: () => {
                this.player.Kick("Your data session ended. Please rejoin!");
            },
        });

        if (!profile) {
            this.player.Kick("Failed to load data. Please rejoin!");
            return false;
        }

        this.profile = profile;
        this.data = profile.GetData() as PlayerData;

        this.playerDataBus.FireSync("Data/Loaded", undefined, true, true);

        return true;
    }

    public GetPlayer(): Player {
        return this.player;
    }

    public GetPlayerId(): string {
        return this.playerStringId;
    }

    public GetProfile() {
        if (!this.profile) {
            error(`Profile for player ${this.playerStringId} is not loaded.`);
        }

        return this.profile;
    }

    public GetData(): PlayerData {
        if (!this.data) {
            error(`Data for player ${this.playerStringId} is not loaded.`);
        }

        return this.data;
    }

    public AddValue(path: string, amount: number): void {}
}
