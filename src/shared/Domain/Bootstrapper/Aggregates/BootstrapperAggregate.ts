import { BootstrapStep, BootstrapContext } from "../Types/BootstrapTypes";
BootstrapSorterComponent;
import { BootstrapLoggerComponent } from "../Components/BootstrapLoggerComponents";
import { BootstrapSorterComponent } from "../Components/BootstrapSorterComponents";

export class BootstrapperAggregate<TCtx extends BootstrapContext> {
    private steps: BootstrapStep<TCtx>[] = [];

    private sorter = new BootstrapSorterComponent();
    private logger = new BootstrapLoggerComponent();

    public Register(step: BootstrapStep<TCtx>) {
        this.steps.push(step);
        this.steps = this.sorter.Sort(this.steps);
    }

    public Run(ctx: TCtx) {
        for (const step of this.steps) {
            try {
                this.logger.Log(step.name, ctx.id);
                step.execute(ctx);
            } catch (err) {
                this.logger.Error(step.name, err);
            }
        }
    }

    public Clear() {
        this.steps = [];
    }

    public GetSteps() {
        return [...this.steps];
    }
}
