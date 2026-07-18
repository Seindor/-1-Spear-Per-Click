import EventSlot from "./EventSlot";
import type { Callback, Connection } from "../Types/EventBusTypes";

interface PendingEvent {
    startPriority?: number;
    args: unknown[];
    sync: boolean;
}

export default class EventBusAggregate {
    private events = new Map<string, EventSlot>();
    private pendingEvents = new Map<string, PendingEvent[]>();

    constructor(
        public readonly ownerId: string,
        public readonly busName: string,
    ) {}

    private GetOrCreateEvent(eventName: string) {
        let slot = this.events.get(eventName);

        if (!slot) {
            slot = new EventSlot();
            this.events.set(eventName, slot);
        }

        return slot;
    }

    private AddPendingEvent(
        eventName: string,
        startPriority: number | undefined,
        sync: boolean,
        args: unknown[],
    ) {
        let pending = this.pendingEvents.get(eventName);

        if (!pending) {
            pending = [];
            this.pendingEvents.set(eventName, pending);
        }

        pending.push({
            startPriority,
            args,
            sync,
        });
    }

    private FlushPendingEvents(eventName: string) {
        const slot = this.events.get(eventName);
        if (!slot) return;

        const pending = this.pendingEvents.get(eventName);
        if (!pending) return;

        this.pendingEvents.delete(eventName);

        for (const event of pending) {
            if (event.sync) {
                slot.FireSync(event.startPriority ?? 1, ...event.args);
            } else {
                slot.Fire(event.startPriority ?? 1, ...event.args);
            }
        }
    }

    public Subscribe(
        eventName: string,
        cb: Callback,
        priority?: number,
        subscriptionName?: string,
    ): Connection {
        const slot = this.GetOrCreateEvent(eventName);
        const connection = slot.Subscribe(cb, priority, false, subscriptionName);

        this.FlushPendingEvents(eventName);

        return connection;
    }

    public Once(
        eventName: string,
        cb: Callback,
        priority?: number,
        subscriptionName?: string,
    ): Connection {
        const slot = this.GetOrCreateEvent(eventName);
        const connection = slot.Subscribe(cb, priority, true, subscriptionName);

        this.FlushPendingEvents(eventName);

        return connection;
    }

    public SubscribeT<Args extends unknown[]>(
        eventName: string,
        cb: (...args: Args) => void,
        priority?: number,
        subscriptionName?: string,
    ): Connection {
        return this.Subscribe(eventName, cb as unknown as Callback, priority, subscriptionName);
    }

    public OnceT<Args extends unknown[]>(
        eventName: string,
        cb: (...args: Args) => void,
        priority?: number,
        subscriptionName?: string,
    ): Connection {
        return this.Once(eventName, cb as unknown as Callback, priority, subscriptionName);
    }

    public Fire(
        eventName: string,
        startPriority?: number,
        waitSubscriber?: boolean,
        ...args: unknown[]
    ) {
        const slot = this.events.get(eventName);

        if (!slot || !slot.HasSubscribers()) {
            if (waitSubscriber) {
                this.AddPendingEvent(eventName, startPriority, false, args);
            }

            return;
        }

        slot.Fire(startPriority ?? 1, ...args);
    }

    public FireSync(
        eventName: string,
        startPriority?: number,
        waitSubscriber?: boolean,
        ...args: unknown[]
    ) {
        const slot = this.events.get(eventName);

        if (!slot || !slot.HasSubscribers()) {
            if (waitSubscriber) {
                this.AddPendingEvent(eventName, startPriority, true, args);
            }

            return;
        }

        slot.FireSync(startPriority ?? 1, ...args);
    }

    public HasSubscriber(eventName: string): boolean {
        const slot = this.events.get(eventName);
        if (!slot) return false;

        return slot.HasSubscribers();
    }

    public WaitForSubscriber(eventName: string, timeout?: number): boolean {
        const startedAt = os.clock();

        while (!this.HasSubscriber(eventName)) {
            if (timeout !== undefined && os.clock() - startedAt >= timeout) {
                return false;
            }

            task.wait();
        }

        return true;
    }

    public GetPendingCount(eventName?: string): number {
        if (eventName !== undefined) {
            return this.pendingEvents.get(eventName)?.size() ?? 0;
        }

        let count = 0;

        for (const [, pending] of this.pendingEvents) {
            count += pending.size();
        }

        return count;
    }

    public ClearPending(eventName?: string) {
        if (eventName !== undefined) {
            this.pendingEvents.delete(eventName);
            return;
        }

        this.pendingEvents.clear();
    }

    public Unsubscribe(eventName: string, target: Connection | string) {
        const slot = this.events.get(eventName);
        if (!slot) {
            return;
        }

        if (typeIs(target, "string")) {
            slot.UnsubscribeByName(target);
        } else {
            target.Disconnect();
        }
    }

    public Destroy() {
        for (const [, slot] of this.events) {
            slot.Destroy();
        }

        this.events.clear();
        this.pendingEvents.clear();
    }
}
