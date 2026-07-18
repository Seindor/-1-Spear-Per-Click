import { IUIFrameAggregate } from "../../../Types/TypedAggregates";

export class ScaleOnActivate2 {
    public wrapper: IUIFrameAggregate;
    public activated = false;

    constructor(wrapper: IUIFrameAggregate) {
        this.wrapper = wrapper;
    }

    public Emit() {
        const wrapperUIScale = this.wrapper.instance.WaitForChild("UIScale") as UIScale;

        if (!this.activated) {
            this.activated = true;
            wrapperUIScale.Scale = 1.5;
        } else {
            this.activated = false;
            wrapperUIScale.Scale = 1;
        }
    }
}
