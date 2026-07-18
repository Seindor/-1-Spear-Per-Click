import type { Callback, Connection, Listener, PriorityListener } from "../Types/EventBusTypes";

class LocalConnection implements Connection {
    public Connected = true;

    constructor(private disconnectFn: () => void) {}

    public Disconnect() {
        if (!this.Connected) return;
        this.Connected = false;
        this.disconnectFn();
    }
}

export default class EventSlot {
    private normal: Listener[] = [];
    private staged: PriorityListener[] = [];
    private namedConnections = new Map<string, Connection>();

    private nextOrder = 0;

    public Subscribe(
        cb: Callback,
        priority?: number,
        once = false,
        subscriptionName?: string,
    ): Connection {
        if (subscriptionName) {
            this.UnsubscribeByName(subscriptionName);
        }

        if (priority === undefined) {
            const listener: Listener = { cb, once, connected: true };

            const connection = new LocalConnection(() => {
                listener.connected = false;

                if (subscriptionName) {
                    this.namedConnections.delete(subscriptionName);
                }
            });

            this.normal.push(listener);

            if (subscriptionName) {
                this.namedConnections.set(subscriptionName, connection);
            }

            return connection;
        } else {
            const listener: PriorityListener = {
                cb,
                once,
                connected: true,
                priority,
                order: this.nextOrder++,
            };

            const connection = new LocalConnection(() => {
                listener.connected = false;

                if (subscriptionName) {
                    this.namedConnections.delete(subscriptionName);
                }
            });

            this.staged.push(listener);

            this.staged.sort((a, b) => {
                if (a.priority !== b.priority) return a.priority < b.priority;
                return a.order < b.order;
            });

            if (subscriptionName) {
                this.namedConnections.set(subscriptionName, connection);
            }

            return connection;
        }
    }

    public HasSubscribers(): boolean {
        for (const listener of this.normal) {
            if (listener.connected) {
                return true;
            }
        }

        for (const listener of this.staged) {
            if (listener.connected) {
                return true;
            }
        }

        return false;
    }

    public GetSubscriberCount(): number {
        let count = 0;

        for (const listener of this.normal) {
            if (listener.connected) {
                count++;
            }
        }

        for (const listener of this.staged) {
            if (listener.connected) {
                count++;
            }
        }

        return count;
    }

    public UnsubscribeByName(subscriptionName: string) {
        const connection = this.namedConnections.get(subscriptionName);
        if (!connection) return;

        connection.Disconnect();
        this.namedConnections.delete(subscriptionName);
    }

    public Fire(startPriority: number, ...args: unknown[]) {
        for (const listener of this.normal) {
            if (!listener.connected) continue;

            task.spawn(listener.cb, ...args);

            if (listener.once) {
                listener.connected = false;
            }
        }

        for (const listener of this.staged) {
            if (!listener.connected) continue;
            if (listener.priority < startPriority) continue;

            task.spawn(listener.cb, ...args);

            if (listener.once) {
                listener.connected = false;
            }
        }
    }

    public FireSync(startPriority: number, ...args: unknown[]) {
        for (const listener of this.normal) {
            if (!listener.connected) continue;

            listener.cb(...args);

            if (listener.once) {
                listener.connected = false;
            }
        }

        for (const listener of this.staged) {
            if (!listener.connected) continue;
            if (listener.priority < startPriority) continue;

            listener.cb(...args);

            if (listener.once) {
                listener.connected = false;
            }
        }
    }

    public Destroy() {
        for (const [, connection] of this.namedConnections) {
            connection.Disconnect();
        }

        this.namedConnections.clear();
        this.normal = [];
        this.staged = [];
    }
}
