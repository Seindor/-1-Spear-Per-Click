import { ProximtyService } from "../Services/Proximity-Service";
import { ProximityCallBacks } from "../Types/Type";

export class ProximityAPI {
    private readonly service = new ProximtyService();

    public New(BasePart: BasePart, CallBacks: ProximityCallBacks | undefined) {
        return this.service.Create(BasePart, CallBacks);
    }
    public ChangeCallBack(
        BasePart: BasePart,
        CallBackName: keyof ProximityCallBacks,
        callback: ProximityCallBacks[keyof ProximityCallBacks],
    ) {
        this.service.ChangeCallBack(BasePart, CallBackName, callback);
    }
    public Destroy(BasePart: BasePart) {
        this.service.Destroy(BasePart);
    }
}
