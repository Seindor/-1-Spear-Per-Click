import { UIButtonAggregate } from "../Aggregates/UIButtonAggregate";
import { UIFrameAggregate } from "../Aggregates/UIFrameAggregate";
import { FrameInstanceType } from "../Types/UIWrapperTypes";

type WrapperFor<T extends GuiObject> = T extends GuiButton
    ? UIButtonAggregate<T>
    : UIFrameAggregate<T & FrameInstanceType>;

export class UIWrapperService {
    private wrappers = new Map<GuiObject, UIButtonAggregate<any> | UIFrameAggregate<any>>();

    public Create<T extends GuiObject>(instance: T): WrapperFor<T> {
        if (this.wrappers.has(instance)) {
            return this.wrappers.get(instance)! as WrapperFor<T>;
        }

        const wrapper: UIButtonAggregate<any> | UIFrameAggregate<any> = instance.IsA("GuiButton")
            ? new UIButtonAggregate(instance)
            : new UIFrameAggregate(instance as FrameInstanceType);

        this.wrappers.set(instance, wrapper);

        return wrapper as WrapperFor<T>;
    }

    public Get<T extends GuiObject>(instance: T): WrapperFor<T> | undefined {
        return this.wrappers.get(instance) as WrapperFor<T> | undefined;
    }

    public Remove(instance: GuiObject, destroyInstance?: boolean) {
        const wrapper = this.wrappers.get(instance);
        if (!wrapper) return;

        wrapper.Destroy();
        this.wrappers.delete(instance);

        if (destroyInstance) {
            instance.Destroy();
        }
    }

    public GetAll(): (UIButtonAggregate<any> | UIFrameAggregate<any>)[] {
        const result = [];

        for (const [, wrapper] of this.wrappers) {
            result.push(wrapper);
        }

        return result;
    }

    public Clear() {
        for (const [, wrapper] of this.wrappers) {
            wrapper.Destroy();
        }

        this.wrappers.clear();
    }

    public FixCanvas(
        scrollingFrame: ScrollingFrame,
        extraPadding?: number,
        axis: "X" | "Y" = "Y",
    ): void {
        const layout = scrollingFrame.FindFirstChildWhichIsA("UIListLayout");
        if (!layout) return;

        const padding = scrollingFrame.FindFirstChildWhichIsA("UIPadding");
        scrollingFrame.AutomaticCanvasSize = Enum.AutomaticSize.None;

        task.spawn(() => {
            while (scrollingFrame.AbsoluteSize.Y < 1) task.wait();

            const absSize = scrollingFrame.AbsoluteSize;

            const layoutPadding = math.floor(
                layout.Padding.Scale * (axis === "Y" ? absSize.X : absSize.Y) +
                    layout.Padding.Offset,
            );
            layout.Padding = new UDim(0, math.max(layoutPadding, 0));

            if (padding) {
                const top = math.floor(
                    padding.PaddingTop.Scale * absSize.Y + padding.PaddingTop.Offset,
                );
                const bottom = math.floor(
                    padding.PaddingBottom.Scale * absSize.Y + padding.PaddingBottom.Offset,
                );
                const left = math.floor(
                    padding.PaddingLeft.Scale * absSize.X + padding.PaddingLeft.Offset,
                );
                const right = math.floor(
                    padding.PaddingRight.Scale * absSize.X + padding.PaddingRight.Offset,
                );

                padding.PaddingTop = new UDim(0, math.max(top, 0));
                padding.PaddingBottom = new UDim(0, math.max(bottom, 0));
                padding.PaddingLeft = new UDim(0, math.max(left, 0));
                padding.PaddingRight = new UDim(0, math.max(right, 0));
            }

            task.wait();

            const contentSize = layout.AbsoluteContentSize;

            scrollingFrame.CanvasSize =
                axis === "Y"
                    ? new UDim2(0, contentSize.X, 0, contentSize.Y + (extraPadding ?? 0))
                    : new UDim2(0, contentSize.X + (extraPadding ?? 0), 0, contentSize.Y);
        });
    }
}
