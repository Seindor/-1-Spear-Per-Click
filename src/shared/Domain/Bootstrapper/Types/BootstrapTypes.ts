export interface BootstrapContext {
    readonly id: string;
}

export interface BootstrapStep<TCtx extends BootstrapContext = BootstrapContext> {
    name: string;
    priority: number;

    execute(ctx: TCtx): void;
}

export interface BootstrapStepResult {
    success: boolean;
    error?: string;
}
