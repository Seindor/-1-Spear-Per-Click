import type { TraceEntryLite } from "../Types/TraceTypes";

export class TraceClipAggregate {
    private entries: TraceEntryLite[] = [];

    constructor(private windowSeconds = 100) {}

    push(entry: TraceEntryLite) {
        this.entries.push(entry);
        this.trim(os.clock());
    }

    private trim(now: number) {
        const minT = now - this.windowSeconds;

        let firstValidIndex = 0;

        while (firstValidIndex < this.entries.size() && this.entries[firstValidIndex].time < minT) {
            firstValidIndex++;
        }

        if (firstValidIndex > 0) {
            const newArr: TraceEntryLite[] = [];

            for (let i = firstValidIndex; i < this.entries.size(); i++) {
                newArr.push(this.entries[i]);
            }

            this.entries = newArr;
        }
    }

    snapshot(): TraceEntryLite[] {
        this.trim(os.clock());

        const copy: TraceEntryLite[] = [];
        for (let i = 0; i < this.entries.size(); i++) {
            copy.push(this.entries[i]);
        }

        return copy;
    }

    clear() {
        this.entries = [];
    }
}
