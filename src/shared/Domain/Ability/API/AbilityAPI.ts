import { AbilityAggregate } from "../Aggregates/AbilityAggregate";
import { AbilityService } from "../Services/AbilityService";
import { IAbilityBehaviour, IAbilityConfig, IAbilityType } from "../Types/AbilityTypes";

type AbilityEvent =
    | "Started"
    | "Ended"
    | "Interrupted"
    | "Rejected"
    | "CooldownStarted"
    | "CooldownEnded";

export class AbilityAPI {
    private service = new AbilityService();

    public initActor(id: string) {
        this.service.initActor(id);
    }

    public Subscribe(
        ownerId: string,
        events: AbilityEvent[],
        callback: (ability: AbilityAggregate) => void,
        subscribeName: string,
    ) {
        this.service.Subscribe(ownerId, events, callback, subscribeName);
    }

    public Unsubscribe(ownerId: string, subscribeName: string) {
        this.service.Unsubscribe(ownerId, subscribeName);
    }

    public AddBlockTags(id: string, tags: IAbilityType[]) {
        this.service.AddBlockTags(id, tags);
    }

    public GetBlockTag(id: string, tagName: string) {
        return this.service.GetBlockTag(id, tagName);
    }

    public GetBlockTags(id: string) {
        return this.service.GetBlockTags(id);
    }

    public RemoveBlockTags(id: string, tags: string[] | "all") {
        this.service.RemoveBlockTags(id, tags);
    }

    public Create(config: IAbilityConfig, behaviours: IAbilityBehaviour) {
        return this.service.Create(config, behaviours);
    }

    public Get(ownerId: string, abilityName: string) {
        return this.service.Get(ownerId, abilityName);
    }

    public GetAllAbilities(ownerId: string) {
        return this.service.GetAllAbilities(ownerId);
    }

    public Remove(ownerId: string, abilityName: string) {
        this.service.Remove(ownerId, abilityName);
    }

    public Execute(
        ability: AbilityAggregate,
        callBackName: "Start" | "End",
        check: boolean,
        ...args: unknown[]
    ) {
        this.service.Execute(ability, callBackName, check, ...args);
    }

    public Reject(ability: AbilityAggregate, ...args: unknown[]) {
        this.service.Reject(ability, ...args);
    }

    public Interrupt(ability: AbilityAggregate, ...args: unknown[]) {
        this.service.Interrupt(ability, ...args);
    }
}
