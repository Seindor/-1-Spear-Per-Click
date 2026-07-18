import type {
    AbilityBindEntry,
    AbilityPackDefinition,
} from "shared/Types/Game/Abilities/AbilityPackTypes";

import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";

const sharedScope = CompositionRootShared.createScope();

const abilityAPI = sharedScope.resolve(SharedRegistry.Singletons.API.AbilityAPI);

export class AbilityLoadout {
    public readonly ownerId: string;

    private readonly packs = new Map<string, AbilityPackDefinition>();
    private index = new Map<string, AbilityBindEntry[]>();
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

    public GetEntriesFor(key: string): AbilityBindEntry[] {
        this.RebuildIfDirty();
        return this.index.get(key) ?? [];
    }

    public GetAllKeys(): string[] {
        this.RebuildIfDirty();
        const keys: string[] = [];
        for (const [key] of this.index) keys.push(key);
        return keys;
    }

    private RebuildIfDirty(): void {
        if (!this.dirty) return;

        const index = new Map<string, AbilityBindEntry[]>();

        for (const [, pack] of this.packs) {
            for (const [, entry] of pairs(pack.abilities)) {
                const list = index.get(entry.key) ?? [];
                list.push(entry);
                index.set(entry.key, list);
            }
        }

        for (const [, list] of index) {
            list.sort((a, b) => a.priority < b.priority);
        }

        this.index = index;
        this.dirty = false;
    }
}
