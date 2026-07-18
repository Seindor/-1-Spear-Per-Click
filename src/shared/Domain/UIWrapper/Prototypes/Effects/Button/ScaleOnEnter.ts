import { IUIButtonAggregate } from "shared/Domain/UIWrapper/Types/TypedAggregates";

export class ScaleOnEnter {
    public wrapper: IUIButtonAggregate;

    constructor(wrapper: IUIButtonAggregate) {
        this.wrapper = wrapper;
        this.Emit();
    }

    public Emit() {
        let wrapperUIScale = this.wrapper.instance.FindFirstChildWhichIsA(
            "UIScale",
            true,
        ) as UIScale;

        if (!wrapperUIScale) {
            warn(`Can't find UIScale from ${this.wrapper}`);
        }

        const scaledNumber = 1.035;
        const basicNumber = 1;

        this.wrapper.AddCallback("MouseEnter", "ScaleOnEnter", () => {
            this.wrapper.miscData.set("ScaleOnEnter", scaledNumber);

            wrapperUIScale.Scale = scaledNumber;
        });

        this.wrapper.AddCallback("MouseLeave", "ScaleOnLeave", () => {
            this.wrapper.miscData.set("ScaleOnEnter", basicNumber);

            wrapperUIScale.Scale = basicNumber;
        });
    }
}
