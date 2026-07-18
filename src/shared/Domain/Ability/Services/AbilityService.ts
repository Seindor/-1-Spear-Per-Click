import { AbilityAggregate } from "../Aggregates/AbilityAggregate";
import { IAbilityType, IAbilityConfig, IAbilityBehaviour } from "../Types/AbilityTypes";

type AbilityEvent =
    | "Started"
    | "Ended"
    | "Interrupted"
    | "Rejected"
    | "CooldownStarted"
    | "CooldownEnded";

type SubscriptionCallback = (ability: AbilityAggregate) => void;

interface Subscription {
    id: string;
    events: Set<AbilityEvent>;
    callback: SubscriptionCallback;
}

export class AbilityService {
    private readonly BlockedTags = new Map<string, IAbilityType[]>();
    private readonly Abilities = new Map<string, Map<string, AbilityAggregate>>();

    private readonly Subscriptions = new Map<string, Subscription[]>();

    public initActor(id: string) {
        if (!this.Abilities.has(id)) {
            this.Abilities.set(id, new Map());
        }

        if (!this.BlockedTags.has(id)) {
            this.BlockedTags.set(id, []);
        }

        if (!this.Subscriptions.has(id)) {
            this.Subscriptions.set(id, []);
        }
    }

    public Subscribe(
        ownerId: string,
        events: AbilityEvent[],
        callback: SubscriptionCallback,
        subscribeName: string,
    ) {
        this.initActor(ownerId);

        const subs = this.Subscriptions.get(ownerId)!;

        subs.push({
            id: subscribeName,
            events: new Set(events),
            callback,
        });
    }

    public Unsubscribe(ownerId: string, subscribeName: string) {
        const subs = this.Subscriptions.get(ownerId);
        if (!subs) return;

        this.Subscriptions.set(
            ownerId,
            subs.filter((s) => s.id !== subscribeName),
        );
    }

    private emit(ownerId: string, event: AbilityEvent, ability: AbilityAggregate) {
        const subs = this.Subscriptions.get(ownerId);
        if (!subs) return;

        for (const sub of subs) {
            if (sub.events.has(event)) {
                task.spawn(() => sub.callback(ability));
            }
        }
    }

    private isBlockedByTag(id: string, tags: IAbilityType[]): boolean {
        const blockedTags = this.BlockedTags.get(id);
        if (!blockedTags) return false;

        for (const abilityTag of tags) {
            for (const blockedTag of blockedTags) {
                if (abilityTag.name === blockedTag.name) {
                    if (blockedTag.level >= abilityTag.level) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    public AddBlockTags(id: string, tags: IAbilityType[]) {
        this.initActor(id);

        const entityTags = this.BlockedTags.get(id)!;

        for (const newTag of tags) {
            const existingIndex = entityTags.findIndex((t) => t.name === newTag.name);

            if (existingIndex !== -1) {
                if (newTag.level > entityTags[existingIndex].level) {
                    entityTags[existingIndex] = newTag;
                }
            } else {
                entityTags.push(newTag);
            }
        }
    }

    public GetBlockTag(id: string, tagName: string): IAbilityType | undefined {
        return this.BlockedTags.get(id)?.find((t) => t.name === tagName);
    }

    public GetBlockTags(id: string): IAbilityType[] {
        this.initActor(id);
        return this.BlockedTags.get(id)!;
    }

    public RemoveBlockTags(id: string, tags: string[] | "all") {
        this.initActor(id);

        if (tags === "all") {
            this.BlockedTags.set(id, []);
            return;
        }

        const entityTags = this.BlockedTags.get(id)!;

        this.BlockedTags.set(
            id,
            entityTags.filter((t) => !tags.includes(t.name)),
        );
    }

    public ValidateAbility(ability: AbilityAggregate): boolean {
        this.initActor(ability.config.ownerId);

        const ownerAbilities = this.Abilities.get(ability.config.ownerId)!;

        if (ownerAbilities.has(ability.config.name)) {
            return false;
        }

        ownerAbilities.set(ability.config.name, ability);

        return true;
    }

    public Create(_config: IAbilityConfig, _behaviours: IAbilityBehaviour): AbilityAggregate {
        const ability = new AbilityAggregate(_config, _behaviours);

        const validate = this.ValidateAbility(ability);

        if (validate) return ability;

        const existing = this.Abilities.get(ability.config.ownerId)!.get(ability.config.name);

        if (!existing) throw error("existingAbility is undefined");

        ability.Destroy();
        return existing;
    }

    public Get(ownerId: string, abilityName: string) {
        return this.Abilities.get(ownerId)?.get(abilityName);
    }

    public GetAllAbilities(ownerId: string) {
        return this.Abilities.get(ownerId);
    }

    public Remove(ownerId: string, abilityName: string) {
        const ownerAbilities = this.Abilities.get(ownerId);
        if (!ownerAbilities) return;

        const ability = ownerAbilities.get(abilityName);
        if (!ability) return;

        ability.Destroy();
        ownerAbilities.delete(abilityName);
    }

    public Execute(
        ability: AbilityAggregate,
        callBackName: "Start" | "End",
        check: boolean,
        ...args: unknown[]
    ) {
        const ownerId = ability.config.ownerId;

        if (callBackName === "Start" && check) {
            const blocked = this.isBlockedByTag(ownerId, ability.config.types);

            if (blocked) {
                ability.Reject(...args);
                return;
            }
        }

        ability.Execute(callBackName, check, ...args);
    }

    public Reject(ability: AbilityAggregate, ...args: unknown[]) {
        ability.Reject(...args);
    }

    public Interrupt(ability: AbilityAggregate, ...args: unknown[]) {
        ability.Interrupt(...args);
    }
}
