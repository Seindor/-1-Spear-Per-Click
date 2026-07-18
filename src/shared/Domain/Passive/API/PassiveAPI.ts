import { PassiveAggregate } from "../Aggregates/PassiveAggregate";
import { PassiveService } from "../Services/PassiveService";
import { PassiveProperties } from "../Types/PassiveTypes";

export class PassiveAPI {
    public service = new PassiveService();

    public InitActor(actorId: string, overwrite?: boolean) {
        this.service.InitActor(actorId, overwrite);
    }

    public RemoveActor(actorId: string) {
        this.service.RemoveActor(actorId);
    }

    public CreatePassive(
        passiveProperties: PassiveProperties,
        overwrite?: boolean,
    ): PassiveAggregate {
        return this.service.CreatePassive(passiveProperties, overwrite);
    }

    public GetPassive(actorId: string, passiveName: string): PassiveAggregate | undefined {
        return this.service.GetPassive(actorId, passiveName);
    }

    public RemovePassive(actorId: string, passiveName: string) {
        this.service.RemovePassive(actorId, passiveName);
    }
}
