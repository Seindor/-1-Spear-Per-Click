import type { BootstrapStep, BootstrapContext } from "../Types/BootstrapTypes";

export class BootstrapSorterComponent {
    public Sort<TCtx extends BootstrapContext>(
        steps: BootstrapStep<TCtx>[],
    ): BootstrapStep<TCtx>[] {
        return [...steps].sort((a, b) => {
            return a.priority < b.priority;
        });
    }
}
