import { TraceEvent, TraceEntryLite } from "../Types/TraceTypes";

import { TraceClipAggregate } from "../Aggregates/TraceClipAggregate";
import { TraceService } from "../Services/TraceClipService";

export class TraceClipAPI {
    private service: TraceService;
    constructor() {
        this.service = new TraceService(30);
    }

    public ensure(actorId: string): TraceClipAggregate {
        return this.service.ensure(actorId);
    }

    public log(
        actorId: string,
        event: TraceEvent,
        message: string,
        extra?: Partial<TraceEntryLite>,
        miscData?: Record<string, unknown>,
    ) {
        this.service.log(actorId, event, message, extra, miscData);
    }

    public snapshot(actorId: string) {
        return this.service.snapshot(actorId);
    }

    public clear(actorId: string) {
        this.service.clear(actorId);
    }
}
