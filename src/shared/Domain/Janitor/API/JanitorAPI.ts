import { JanitorService } from "../Services/JanitorService";

export class JanitorAPI {
    private service = new JanitorService();

    public CreateActor(actorId: string) {
        return this.service.CreateActor(actorId);
    }

    public GetActor(actorId: string) {
        return this.service.GetActor(actorId);
    }

    public RemoveActor(actorId: string) {
        return this.service.RemoveActor(actorId);
    }

    public HasActor(actorId: string) {
        return this.service.HasActor(actorId);
    }

    public Create(actorId: string, janitorId: string, overwrite?: boolean) {
        return this.service.Create(actorId, janitorId, overwrite);
    }

    public Get(actorId: string, janitorId: string) {
        return this.service.Get(actorId, janitorId);
    }

    public Remove(actorId: string, janitorId: string) {
        return this.service.Remove(actorId, janitorId);
    }

    public Clear(actorId: string) {
        return this.service.Clear(actorId);
    }
}
