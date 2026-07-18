import { ReplicatedController } from "shared/Domain/Runtime/Components/ReplicatedController";

import { SessionContext } from "shared/Types/Runtime/SessionRuntime";

import { RuntimeEquipmentState } from "shared/Types/Replicators/Runtime/RuntimeEquipmentState";

import { DataHandler } from "server/Implementation/Handlers/DataHandler";
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
        fightingStyle: `none`,
        weapon: `none`,
        currentStage: `Stage_1`,
    };

    private dataHandler?: DataHandler;
    private serverAbilityHanlder?: ServerAbilityHandler;

    protected OnInit(): void {
        print(`${this.Name} Initialized for ${this.runtime.Context.id}`);

        this.dataHandler = this.runtime.GetMeta<DataHandler>("DataHandler");
        this.serverAbilityHanlder = new ServerAbilityHandler(this.runtime.Context.id);

        this.runtime.SetMeta(`serverAbilityHanlder`, this.serverAbilityHanlder);

        if (this.dataHandler) {
            const data = this.dataHandler.GetData();
            const slotData = data.slots.find((slot) => slot.slotInfo.slotId === data.currentSlot);

            this.state.fightingStyle = slotData?.character.equipment.fightingStyle ?? `none`;

            this.state.weapon = slotData?.character.equipment.weapon ?? `none`;

            this.state.currentStage = `Stage_1`;
        } else {
            this.state.fightingStyle =
                this.runtime.GetMeta<string>("initial/FightingStyle") ?? `none`;

            this.state.weapon = this.runtime.GetMeta<string>("initial/Weapon") ?? `none`;
        }

        this.UpdateWeaponAbilitiesPack();

        this.SyncToReplicator();
    }

    public ChangeWeaponPack(weapon: string) {
        this.state.weapon = weapon;

        if (this.dataHandler) {
            const data = this.dataHandler.GetData();
            const slotData = data.slots.find((slot) => slot.slotInfo.slotId === data.currentSlot);

            if (!slotData) return;

            slotData.character.equipment.weapon = this.state.weapon;
        }

        this.SyncToReplicator();
    }

    public UpdateWeaponAbilitiesPack() {
        if (!this.serverAbilityHanlder) return;
        if (this.state.weapon === `none`) return;

        const module = ParseAliasModulePath(
            `server/Implementation/Entities/Abilities/${this.state.weapon}/${this.state.currentStage}`,
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

        runtimeEquipmentReplicator
            ?.UpdateDataWithPath(this.runtime.Context.id)
            .Set(`flags/fightingStyle`, this.state.fightingStyle);

        runtimeEquipmentReplicator
            ?.UpdateDataWithPath(this.runtime.Context.id)
            .Set(`flags/weapon`, this.state.weapon);

        runtimeEquipmentReplicator
            ?.UpdateDataWithPath(this.runtime.Context.id)
            .Set(`flags/currentStage`, this.state.currentStage);
    }
}
