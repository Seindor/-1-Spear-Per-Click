import { ReplicatedController } from "shared/Domain/Runtime/Components/ReplicatedController";
import { SessionContext } from "shared/Types/Runtime/SessionRuntime";

export class CharacterController extends ReplicatedController<SessionContext> {
    public readonly Name = `CharacterController`;

    public OnInit(): void {
        this.runtime.Context.id;
    }

    public Serialize() {
        return {};
    }

    public OnDestroy(): void {}
}
