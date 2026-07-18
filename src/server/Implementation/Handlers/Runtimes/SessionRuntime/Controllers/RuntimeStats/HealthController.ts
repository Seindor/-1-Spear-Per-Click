import { ReplicatedController } from "shared/Domain/Runtime/Components/ReplicatedController";

import type { SessionContext } from "shared/Types/Runtime/SessionRuntime";
import type { ServerReplicatedAtomAPI } from "shared/Domain/ReplicatedAtoms/API/ServerReplicatedAtomAPI";
import type { RuntimeStatsReplicator } from "server/Implementation/Handlers/Replicators/Runtime/RuntimeStatsReplicator";
import type { DataHandler } from "server/Implementation/Handlers/DataHandler";

import { PlayerDataReplicator } from "server/Implementation/Handlers/Replicators/PlayerDataReplicator";

import { CompositionRootServer } from "server/DI/CompositionRootServer";
import { ServerRegistry } from "server/DI/Generated/ServerRegistry";
import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";
import EventBusAggregate from "shared/Domain/EventBus/Aggregates/EventBusAggregate";

const serverScope = CompositionRootServer.createScope();
const sharedScope = CompositionRootShared.createScope();

const serverReplicatedAtomAPI = serverScope.resolve(
    ServerRegistry.Singletons.API.ServerAtomAPI,
) as ServerReplicatedAtomAPI;

const eventBusAPI = sharedScope.resolve(SharedRegistry.Singletons.API.EventBusAPI);

export class HealthController extends ReplicatedController<SessionContext> {
    public readonly Name = "HealthController";

    private health = 100;
    private maxHealth = 100;
    private dataHandler?: DataHandler;

    public buses!: {
        entity: EventBusAggregate;
    };

    protected OnInit(): void {
        print(`${this.Name} Initialized for ${this.runtime.Context.id}`);

        this.dataHandler = this.runtime.GetMeta<DataHandler>("DataHandler");

        this.buses = {
            entity: eventBusAPI.New(this.runtime.Context.id, `Entity`),
        };

        if (this.dataHandler) {
            const data = this.dataHandler.GetData();
            const slotData = data.slots.find((slot) => slot.slotInfo.slotId === data.currentSlot);

            this.health = slotData?.character.status.health ?? 100;
            this.maxHealth = 100;
        } else {
            this.health = this.runtime.GetMeta<number>("initial/Health") ?? 100;
            this.maxHealth = this.runtime.GetMeta<number>("initial/MaxHealth") ?? 100;
        }

        this.SyncToReplicator();
    }

    protected OnDestroy(): void {}

    public Damage(value: number): void {
        this.health = math.clamp(value, 0, this.maxHealth);
        this.SyncToReplicator();
        this.buses.entity.Fire(`Health/Damaged`, undefined, false, this.health, this.maxHealth);

        if (this.health <= 0) {
            this.buses.entity.Fire(`Health/Killed`, undefined, false, this.health, this.maxHealth);
        }
    }

    public Heal(value: number): void {
        this.health = math.clamp(this.health + value, 0, this.maxHealth);
        this.SyncToReplicator();
        this.buses.entity.Fire(`Health/Healed`, undefined, false, this.health, this.maxHealth);
    }

    public Restore(): void {
        this.health = math.clamp(this.maxHealth, 0, this.maxHealth);
        this.buses.entity.Fire(`Health/Restored`, undefined, false, this.health, this.maxHealth);
    }

    public Gethealth(): number {
        return this.health;
    }
    public IsDead(): boolean {
        return this.health <= 0;
    }

    protected Serialize() {
        return { health: this.health, maxHealth: this.maxHealth };
    }

    private SyncToReplicator(): void {
        if (!this.dataHandler) return;

        const data = this.dataHandler.GetData();

        serverReplicatedAtomAPI
            .Get<RuntimeStatsReplicator>("RuntimeStats")
            ?.UpdateDataWithPath(this.runtime.Context.id)
            .Set(`health`, { value: this.health, maxValue: this.maxHealth });

        serverReplicatedAtomAPI
            .Get<PlayerDataReplicator>(`PlayerData`)
            ?.UpdateSlot(this.runtime.Context.id, data.currentSlot)
            .Set(`character/status/health`, this.health);
    }
}
