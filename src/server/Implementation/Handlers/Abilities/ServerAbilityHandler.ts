import type { AbilityPackDefinition } from "server/Types/Game/AbilityPackDefinitions";

import { ServerAbilityLoadout } from "./ServerAbilityLoadout";

import { ServerSignals } from "shared/Implementation/Entities/SerrverSignals";

import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";
import { AbilityNetworkMethod } from "shared/Types/Game/Abilities/AbilityPackTypes";

const sharedScope = CompositionRootShared.createScope();

const abilityAPI = sharedScope.resolve(SharedRegistry.Singletons.API.AbilityAPI);

export class ServerAbilityHandler {
    private readonly loadout: ServerAbilityLoadout;

    constructor(private readonly ownerId: string) {
        this.loadout = new ServerAbilityLoadout(ownerId);
        abilityAPI.initActor(ownerId);
    }

    public AttachPack(pack: AbilityPackDefinition): void {
        this.loadout.AddPack(pack);
    }

    public DetachPack(packName: string, deleteAbilities?: boolean): void {
        this.loadout.RemovePack(packName, deleteAbilities);
    }

    public DetachAllPacks(deleteAbilities?: boolean): void {
        this.loadout.RemoveAllPacks(deleteAbilities);
    }

    public HasPack(packName: string): boolean {
        return this.loadout.HasPack(packName);
    }

    public HandleNetworkCommand(abilityName: string, method: AbilityNetworkMethod): void {
        const entry = this.loadout.GetEntryByAbilityName(abilityName);
        if (!entry) {
            warn(
                `[ServerAbilityHandler] "${this.ownerId}" requested unknown ability "${abilityName}"`,
            );
            return;
        }

        if (method === "Start" || method === "End") {
            abilityAPI.Execute(entry.ability, method, false);
            return;
        }

        if (method === "Interrupt") {
            entry.ability.Interrupt();
        }
    }
}
