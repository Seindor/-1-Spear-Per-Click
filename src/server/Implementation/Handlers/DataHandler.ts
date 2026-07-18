import { Dependency, Service } from "@flamework/core";

import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { ServerRegistry } from "server/DI/Generated/ServerRegistry";

import { CompositionRootShared } from "shared/DI/CompositionRootShared";
import { CompositionRootServer } from "server/DI/CompositionRootServer";

import type { ISlotRecievedInfo, PlayerData } from "shared/Types/Database/PlayerData";
import EventBusAggregate from "shared/Domain/EventBus/Aggregates/EventBusAggregate";
import { DataProfileAggregate } from "server/Domain/DataStore/Aggregates/DataProfileAggregate";
import { Race } from "shared/Types/Database/Race";
import { Gender } from "shared/Types/Database/Gender";
import { TableHelper } from "shared/Utilities/TableHelper";
import { DeepCloneComponent } from "shared/Domain/ReplicatedAtoms/Components/AtomPathAccessorComponent";
import { CreatePlayerSlotTemplate } from "shared/Implementation/Entities/Templates/Data/PlayerSlotTemplate";

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

        if (this.data.slots.size() === 0) {
            this.CreateBlankSlot();
        } else {
            this.ReconcileExistingSlots();
        }

        this.playerDataBus.FireSync("Data/Loaded", undefined, true, true);

        return true;
    }

    private ReconcileExistingSlots(): void {
        this.GetProfile().ReconcileArray(this.data!.slots, CreatePlayerSlotTemplate());
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

    public CreateBlankSlot() {
        let slot = CreatePlayerSlotTemplate();

        this.data!.slots.push(slot);
    }

    public SetupSlot(slotId: string, name: string, gender: Gender, race: Race) {
        let slot = this.data!.slots.find((slot) => slot.slotInfo.slotId === slotId);

        if (!slot) {
            warn(`Cannot find slot: ${slotId}`);
            return;
        }

        if (slot.slotInfo.setuped === true) {
            warn(`${slotId} already setup.`);
            return;
        }

        slot.character.profile.name = name;
        slot.character.profile.gender = gender;
        slot.character.profile.race = race;

        slot.slotInfo.setuped = true;
        this.SyncReplicators();
    }

    public SelectSlot(slotId: string) {
        let slot = this.data!.slots.find((slot) => slot.slotInfo.slotId === slotId);

        if (!slot) {
            warn(`Cannot find slot: ${slotId}`);
            return;
        }

        this.data!.currentSlot = slotId;
        this.SyncReplicators();
    }

    public WipeSlot(slotId: string) {
        const slots = this.GetData().slots;

        const index = slots.findIndex((slot) => slot.slotInfo.slotId === slotId);

        if (index === -1) {
            warn(`Cannot find slot: ${slotId}`);
            return;
        }

        slots[index] = CreatePlayerSlotTemplate();
        this.SyncReplicators();
    }

    public SyncReplicators() {
        this.playerDataBus.Fire(`SyncReplicators`);
    }
}
