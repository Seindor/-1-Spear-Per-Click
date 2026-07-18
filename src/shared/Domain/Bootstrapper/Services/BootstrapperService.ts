import { BootstrapperAggregate } from "../Aggregates/BootstrapperAggregate";
import { BootstrapContext } from "../Types/BootstrapTypes";

export class BootstrapperService {
    private bootstrappers = new Map<string, BootstrapperAggregate<any>>();

    public GetOrCreate<TCtx extends BootstrapContext>(name: string) {
        let bootstrapper = this.bootstrappers.get(name);

        if (!bootstrapper) {
            bootstrapper = new BootstrapperAggregate<TCtx>();
            this.bootstrappers.set(name, bootstrapper);
        }

        return bootstrapper as BootstrapperAggregate<TCtx>;
    }

    public Remove(name: string) {
        this.bootstrappers.delete(name);
    }

    public Clear() {
        this.bootstrappers.clear();
    }
}
