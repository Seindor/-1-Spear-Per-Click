import type {
    AbilityBindEntry,
    AbilityPackDefinition,
} from "server/Types/Game/AbilityPackDefinitions";

import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";

const sharedScope = CompositionRootShared.createScope();

const abilityAPI = sharedScope.resolve(SharedRegistry.Singletons.API.AbilityAPI);

export class ServerAbilityLoadout {
    public readonly ownerId: string;

    private readonly packs = new Map<string, AbilityPackDefinition>();
    private index = new Map<string, AbilityBindEntry>();
    private dirty = true;

    constructor(ownerId: string) {
        this.ownerId = ownerId;
    }

    public DeletePacksAbilities() {
        for (const [index, pack] of this.packs) {
            for (const [index, abilityBindEntry] of pairs(pack.abilities)) {
                if (abilityBindEntry.ability) {
                    abilityAPI.Remove(this.ownerId, abilityBindEntry.ability.config.name);
                }
            }
        }
    }

    public DeletePackAbilities(pack: AbilityPackDefinition) {
        for (const [index, abilityBindEntry] of pairs(pack.abilities)) {
            if (abilityBindEntry.ability) {
                abilityAPI.Remove(this.ownerId, abilityBindEntry.ability.config.name);
            }
        }
    }

    public AddPack(pack: AbilityPackDefinition): void {
        this.packs.set(pack.name, pack);
        this.dirty = true;
    }

    public RemovePack(packName: string, deleteAbilities?: boolean): void {
        let pack = this.packs.get(packName);

        if (!pack) return;

        if (deleteAbilities === true) {
            this.DeletePackAbilities(pack);
        }

        this.packs.delete(packName);
        pack = undefined;
        this.dirty = true;
    }

    public RemoveAllPacks(deleteAbilities?: boolean): void {
        for (const [index, pack] of this.packs) {
            if (deleteAbilities === true) {
                this.DeletePackAbilities(pack);
            }

            this.packs.delete(index);
        }
        this.dirty = true;
    }

    public HasPack(packName: string): boolean {
        return this.packs.has(packName);
    }

    public GetPacks(): AbilityPackDefinition[] {
        const result: AbilityPackDefinition[] = [];
        for (const [, pack] of this.packs) result.push(pack);
        return result;
    }

    public GetEntryByAbilityName(abilityName: string): AbilityBindEntry | undefined {
        this.RebuildIfDirty();
        return this.index.get(abilityName);
    }

    private RebuildIfDirty(): void {
        if (!this.dirty) return;

        const index = new Map<string, AbilityBindEntry>();

        for (const [, pack] of this.packs) {
            for (const [, entry] of pairs(pack.abilities)) {
                if (index.has(entry.abilityName)) {
                    warn(
                        `[ServerAbilityLoadout] Duplicate abilityName "${entry.abilityName}" across packs — overwriting`,
                    );
                }
                index.set(entry.abilityName, entry);
            }
        }

        this.index = index;
        this.dirty = false;
    }
}
