import { PassiveAggregate } from "../Aggregates/PassiveAggregate";
import { PassiveProperties } from "../Types/PassiveTypes";

export class PassiveService {
    public passivesStorage = new Map<string, PassiveAggregate[]>();

    public InitActor(actorId: string, overwrite?: boolean) {
        if (this.passivesStorage.has(actorId)) {
            if (overwrite) {
                this.RemoveActor(actorId);
                this.passivesStorage.set(actorId, []);
                return;
            } else {
                warn(`${actorId} already exists in Passives list.`);
                return;
            }
        }

        this.passivesStorage.set(actorId, []);
    }

    public RemoveActor(actorId: string) {
        const passives = this.passivesStorage.get(actorId);
        if (!passives) {
            warn(`Cannot find ${actorId} in Passives list.`);
            return;
        }

        const names: string[] = [];
        for (const passive of passives) names.push(passive.name);

        for (const name of names) {
            this.RemovePassive(actorId, name);
        }

        this.passivesStorage.delete(actorId);
    }

    public CreatePassive(
        passiveProperties: PassiveProperties,
        overwrite?: boolean,
    ): PassiveAggregate {
        this.InitActor(passiveProperties.ownerId);
        const passives = this.passivesStorage.get(passiveProperties.ownerId);
        const existing = passives?.find((passive) => passive.name === passiveProperties.name);

        if (existing) {
            if (overwrite) {
                this.RemovePassive(existing.ownerId, existing.name);
                const newPassive = new PassiveAggregate(passiveProperties);
                passives?.push(newPassive);
                return newPassive;
            } else return existing;
        }

        const newPassive = new PassiveAggregate(passiveProperties);
        passives?.push(newPassive);
        return newPassive;
    }

    public GetPassive(actorId: string, passiveName: string): PassiveAggregate | undefined {
        const passives = this.passivesStorage.get(actorId);
        if (!passives) {
            warn(`Cannot find ${actorId} in Passives list.`);
            return undefined;
        }

        const passive = passives.find((p) => p.name === passiveName);
        if (!passive) {
            warn(`Cannot find passive ${passiveName} for ${actorId}.`);
            return undefined;
        }

        return passive;
    }

    public RemovePassive(actorId: string, passiveName: string) {
        const passives = this.passivesStorage.get(actorId);
        if (!passives) {
            warn(`Cannot find ${actorId} in Passives list.`);
            return;
        }

        const index = passives.findIndex((passive) => passive.name === passiveName);
        if (index === -1) {
            warn(`Cannot find passive ${passiveName} for ${actorId}.`);
            return;
        }

        const existing = passives[index];
        existing.Destroy();
        passives.remove(index);
    }
}
