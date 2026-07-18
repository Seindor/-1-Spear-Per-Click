import { JanitorAggregate } from "../Aggregates/JanitorAggregate";
import type { ActorId, JanitorId } from "../Types/JanitorTypes";

export class JanitorService {
    private actors = new Map<ActorId, JanitorAggregate>();

    public CreateActor(actorId: ActorId): JanitorAggregate {
        let actor = this.actors.get(actorId);

        if (!actor) {
            actor = new JanitorAggregate();
            this.actors.set(actorId, actor);
        }

        return actor;
    }

    public GetActor(actorId: ActorId): JanitorAggregate | undefined {
        return this.actors.get(actorId);
    }

    public RemoveActor(actorId: ActorId) {
        const actor = this.actors.get(actorId);
        if (!actor) return;

        actor.Clear();
        this.actors.delete(actorId);
    }

    public HasActor(actorId: ActorId) {
        return this.actors.has(actorId);
    }

    public Create(actorId: ActorId, janitorId: JanitorId, overwrite = false) {
        return this.CreateActor(actorId).Create(janitorId, overwrite);
    }

    public Get(actorId: ActorId, janitorId: JanitorId) {
        return this.actors.get(actorId)?.Get(janitorId);
    }

    public Remove(actorId: ActorId, janitorId: JanitorId) {
        this.actors.get(actorId)?.Remove(janitorId);
    }

    public Clear(actorId: ActorId) {
        this.actors.get(actorId)?.Clear();
    }
}
