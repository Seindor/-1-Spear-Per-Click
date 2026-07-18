import { Janitor } from "@rbxts/janitor";
import { IEventBusAggregate } from "shared/Types/GlobalEventBussTypes";

export const PassiveEvents = [
    "PreDamageDeal",
    "DamageDeal",
    "DamageDealt",
    "PreDamageTake",
    "DamageTake",
    "DamageTaken",
    "StatusAdded",
    "StatusRemoved",
] as const;

export type PassiveEventName = (typeof PassiveEvents)[number] | (string & {});

export interface HandlerSubscriber<Args extends unknown[] = unknown[]> {
    eventName: string;
    priority?: number;
    once: boolean;
    callback: (...args: Args) => void;
}

export interface HandlerGroup<Args extends unknown[] = unknown[]> {
    _janitor: Janitor;
    bus: IEventBusAggregate;
    subscribers: Array<HandlerSubscriber<Args>>;
}

export interface PassiveProperties {
    ownerId: string;
    name: string;
    handlers?: Record<string, HandlerGroup<any[]>>;
}
