export type Connection = { Disconnect(): void; Connected: boolean };
export type Callback = (...args: any[]) => void;

export type Listener = {
    cb: Callback;
    once: boolean;
    connected: boolean;
};

export type PriorityListener = Listener & {
    priority: number;
    order: number;
};

export type NamedConnection = Connection & {
    Name?: string;
};
