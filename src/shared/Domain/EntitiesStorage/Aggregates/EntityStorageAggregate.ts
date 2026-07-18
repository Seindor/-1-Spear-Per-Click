import { ArrayHelper } from "shared/Utilities/ArrayHelper";

type StateCallback = (oldValue: unknown | any, newValue: unknown | any) => void;

export class EntityStorageAggregate {
    public entity: unknown;
    public id: string;
    public tags = [] as string[];

    public state = new Map<string, unknown>();

    private stateSubscribers = new Map<string, Map<string, StateCallback>>();

    constructor(entity: unknown, id: string) {
        this.entity = entity;
        this.id = id;
    }

    public AddTag(tag: string, makeUnique = true) {
        ArrayHelper.addString(this.tags, tag, makeUnique);
    }

    public HasTag(tag: string): boolean {
        return ArrayHelper.has(this.tags, tag);
    }

    public RemoveTag(tag: string, makeUnique = true) {
        ArrayHelper.removeString(this.tags, tag, makeUnique);
    }

    public SetState(key: string, value: unknown) {
        const oldValue = this.state.get(key);

        this.state.set(key, value);

        this.NotifyState(key, oldValue, value);
    }

    public GetState<T = unknown>(key: string): T | undefined {
        return this.state.get(key) as T | undefined;
    }

    public HasState(key: string): boolean {
        return this.state.has(key);
    }

    public RemoveState(key: string) {
        const oldValue = this.state.get(key);

        this.state.delete(key);

        this.NotifyState(key, oldValue, undefined);
    }

    public UpdateState<T>(key: string, callback: (currentValue: T | undefined) => T) {
        const currentValue = this.GetState<T>(key);
        const newValue = callback(currentValue);

        this.SetState(key, newValue);
    }

    public SubscribeState(key: string, indexName: string, callback: StateCallback) {
        let subscribers = this.stateSubscribers.get(key);

        if (!subscribers) {
            subscribers = new Map();

            this.stateSubscribers.set(key, subscribers);
        }

        subscribers.set(indexName, callback);
    }

    public UnsubscribeState(key: string, indexName: string) {
        this.stateSubscribers.get(key)?.delete(indexName);
    }

    public ClearState() {
        for (const [key] of this.state) {
            this.RemoveState(key);
        }
    }

    private NotifyState(key: string, oldValue: unknown, newValue: unknown) {
        const subscribers = this.stateSubscribers.get(key);

        if (!subscribers) return;

        for (const [, callback] of subscribers) {
            task.spawn(() => {
                callback(oldValue, newValue);
            });
        }
    }
}
