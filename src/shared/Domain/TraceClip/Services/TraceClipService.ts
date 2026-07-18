import { TraceClipAggregate } from "../Aggregates/TraceClipAggregate";
import type { TraceEntryLite, TraceEvent } from "../Types/TraceTypes";

export class TraceService {
    private clipByActor = new Map<string, TraceClipAggregate>();

    constructor(private windowSeconds: number) {}

    ensure(actorId: string): TraceClipAggregate {
        let clip = this.clipByActor.get(actorId);
        if (!clip) {
            clip = new TraceClipAggregate(this.windowSeconds);
            this.clipByActor.set(actorId, clip);
        }
        return clip;
    }

    log(
        actorId: string,
        event: TraceEvent,
        message: string,
        extra?: Partial<TraceEntryLite>,
        miscData?: Record<string, unknown>,
    ) {
        const clip = this.ensure(actorId);
        clip.push({
            time: os.clock(),
            event,
            message,
            miscData,
            ...extra,
        });
    }

    snapshot(actorId: string) {
        return this.ensure(actorId).snapshot();
    }

    clear(actorId: string) {
        this.ensure(actorId).clear();
    }
}
