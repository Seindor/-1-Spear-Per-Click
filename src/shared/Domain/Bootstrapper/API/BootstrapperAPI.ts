import { BootstrapperService } from "../Services/BootstrapperService";
import { BootstrapContext, BootstrapStep } from "../Types/BootstrapTypes";

export class BootstrapperAPI {
    private service = new BootstrapperService();

    public Create<TCtx extends BootstrapContext>(name: string) {
        return this.service.GetOrCreate<TCtx>(name);
    }

    public Register<TCtx extends BootstrapContext>(name: string, step: BootstrapStep<TCtx>) {
        const bootstrapper = this.service.GetOrCreate<TCtx>(name);
        bootstrapper.Register(step);
    }

    public Run<TCtx extends BootstrapContext>(name: string, ctx: TCtx) {
        const bootstrapper = this.service.GetOrCreate<TCtx>(name);
        bootstrapper.Run(ctx);
    }

    public Remove(name: string) {
        this.service.Remove(name);
    }
}
