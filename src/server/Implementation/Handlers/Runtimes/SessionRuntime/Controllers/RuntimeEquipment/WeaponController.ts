import { ReplicatedController } from "shared/Domain/Runtime/Components/ReplicatedController";

import { SessionContext } from "shared/Types/Runtime/SessionRuntime";

import { RuntimeEquipmentState } from "shared/Types/Replicators/Runtime/RuntimeEquipmentState";

import { DataHandler } from "server/Implementation/Handlers/Game/Data/DataHandler";
import { ServerReplicatedAtomAPI } from "shared/Domain/ReplicatedAtoms/API/ServerReplicatedAtomAPI";

import { CompositionRootServer } from "server/DI/CompositionRootServer";
import { ServerRegistry } from "server/DI/Generated/ServerRegistry";
import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";
import { RuntimeEquipmentReplicator } from "server/Implementation/Handlers/Replicators/Runtime/RuntimeEquipmentReplicator";
import { ServerAbilityHandler } from "server/Implementation/Handlers/Abilities/ServerAbilityHandler";
import { ParseAliasModulePath } from "shared/Utilities/GetObjectFromPath";
import { AbilityPackDefinition } from "server/Types/Game/AbilityPackDefinitions";

const serverScope = CompositionRootServer.createScope();
const sharedScope = CompositionRootShared.createScope();

const serverReplicatedAtomAPI = serverScope.resolve(
    ServerRegistry.Singletons.API.ServerAtomAPI,
) as ServerReplicatedAtomAPI;

export class WeaponController extends ReplicatedController<SessionContext> {
    public readonly Name = `WeaponController`;

    public state = {
        weapon: 0,
        pets: [],
        title: 0,
        aura: 0,
    } as RuntimeEquipmentState;

    private dataHandler?: DataHandler;
    private serverAbilityHanlder?: ServerAbilityHandler;

    protected OnInit(): void {
        print(`${this.Name} Initialized for ${this.runtime.Context.id}`);

        this.dataHandler = this.runtime.GetMeta<DataHandler>("DataHandler");
        this.serverAbilityHanlder = new ServerAbilityHandler(this.runtime.Context.id);

        this.runtime.SetMeta(`serverAbilityHanlder`, this.serverAbilityHanlder);

        if (this.dataHandler) {
            const data = this.dataHandler.GetData();

            this.state.weapon = data.equipment.weapon ?? 1;
        } else {
            this.state.weapon = this.runtime.GetMeta<number>("initial/Weapon") ?? 1;
        }

        this.UpdateWeaponAbilitiesPack();

        this.SyncToReplicator();
    }

    public ChangeWeaponPack(weapon: number) {
        this.state.weapon = weapon;

        if (this.dataHandler) {
            const data = this.dataHandler.GetData();

            data.equipment.weapon = this.state.weapon;
        }

        this.SyncToReplicator();
    }

    public UpdateWeaponAbilitiesPack() {
        if (!this.serverAbilityHanlder) return;
        if (this.state.weapon === 0) return;

        const module = ParseAliasModulePath(
            `server/Implementation/Entities/Abilities/Weapons/Main`,
        );

        if (!module) {
            warn("Ability pack not found");
            return;
        }

        const abilityPack = require(module) as {
            CreateAbilitiesPack: (ownerId: string) => AbilityPackDefinition;
        };

        this.serverAbilityHanlder.DetachAllPacks();
        this.serverAbilityHanlder.AttachPack(
            abilityPack.CreateAbilitiesPack(this.runtime.Context.id),
        );
    }

    protected OnDestroy(): void {}

    protected Serialize(): void {}

    private SyncToReplicator() {
        if (!this.dataHandler) return;

        const data = this.dataHandler.GetData();

        let runtimeEquipmentReplicator =
            serverReplicatedAtomAPI.Get<RuntimeEquipmentReplicator>(`RuntimeEquipment`);

        runtimeEquipmentReplicator?.UpdateActor(this.runtime.Context.id, this.state);
    }
}
