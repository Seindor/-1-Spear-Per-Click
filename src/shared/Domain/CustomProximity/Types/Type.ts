import Signal from "@rbxts/signal";
import { Janitor } from "@rbxts/janitor";
import { ProximtyAggregate } from "../Aggregates/Proximity-Aggregate";

export interface IProximity extends ProximtyAggregate {
    object: ProximityPrompt;
    owner: BasePart;
    janitor: Janitor;
    callBacks: Partial<ProximityCallBacks>;
    signals: ProximitySignals;
}

export interface ProximitySignals {
    onTriggered: Signal<(player: Player) => void>;
    onTriggerEnd: Signal<(player: Player) => void>;
    onPromptShown: Signal<(...args: unknown[]) => void>;
    onPromptHidden: Signal<(...args: unknown[]) => void>;
    onVisibleChange: Signal<(this: IProximity, oldstate: boolean, newstate: boolean) => void>;
}

export interface ProximityCallBacks {
    onTriggered: (player: Player) => void | undefined;
    onTriggerEnd: (player: Player) => void | undefined;
    onPromptShown: (...args: unknown[]) => void | undefined;
    onPromptHidden: (...args: unknown[]) => void | undefined;
}
