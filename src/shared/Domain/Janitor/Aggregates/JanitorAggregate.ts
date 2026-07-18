import { Janitor } from "@rbxts/janitor";
import type { JanitorId } from "../Types/JanitorTypes";

export class JanitorAggregate {
    private janitors = new Map<JanitorId, Janitor<any>>();

    public Create(id: JanitorId, overwrite = false as boolean): Janitor<any> {
        const existing = this.janitors.get(id);

        if (existing && !overwrite) {
            return existing;
        }

        if (existing && overwrite) {
            existing.Destroy();
        }

        const janitor = new Janitor<any>();
        this.janitors.set(id, janitor);

        return janitor;
    }

    public Get(id: JanitorId): Janitor<any> | undefined {
        return this.janitors.get(id);
    }

    public Remove(id: JanitorId) {
        const janitor = this.janitors.get(id);
        if (!janitor) return;

        janitor.Destroy();
        this.janitors.delete(id);
    }

    public Clear() {
        for (const [, janitor] of this.janitors) {
            janitor.Destroy();
        }

        this.janitors.clear();
    }

    public Has(id: JanitorId) {
        return this.janitors.has(id);
    }

    public GetAll() {
        return this.janitors;
    }
}
