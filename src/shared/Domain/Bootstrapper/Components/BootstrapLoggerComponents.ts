export class BootstrapLoggerComponent {
    public Log(step: string, ctxId: string) {
        print(`[BOOTSTRAP] ${step} -> ${ctxId}`);
    }

    public Error(step: string, err: unknown) {
        warn(`[BOOTSTRAP ERROR] ${step}:`, err);
    }
}
