import { UIButtonAggregate } from "../Aggregates/UIButtonAggregate";
import { UIFrameAggregate } from "../Aggregates/UIFrameAggregate";
import { UIWrapperService } from "../Services/UIWrapperService";
import { FrameInstanceType } from "../Types/UIWrapperTypes";

type WrapperFor<T extends GuiObject> = T extends GuiButton
    ? UIButtonAggregate<T>
    : UIFrameAggregate<T & FrameInstanceType>;

export class UIWrapperAPI {
    public service = new UIWrapperService();

    public Create<T extends GuiObject>(instance: T): WrapperFor<T> {
        return this.service.Create(instance);
    }

    public Get<T extends GuiObject>(instance: T): WrapperFor<T> | undefined {
        return this.service.Get(instance);
    }

    public Remove(instance: GuiObject) {
        this.service.Remove(instance);
    }

    public GetAll(): (UIButtonAggregate<any> | UIFrameAggregate<any>)[] {
        return this.service.GetAll();
    }

    public Clear() {
        this.service.Clear();
    }

    public FixCanvas(scrollingFrame: ScrollingFrame, extraPadding?: number, axis: "X" | "Y" = "Y") {
        this.service.FixCanvas(scrollingFrame, extraPadding, axis);
    }
}
