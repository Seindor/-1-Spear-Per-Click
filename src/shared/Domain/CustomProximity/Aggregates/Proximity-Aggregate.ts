import { IProximity, ProximityCallBacks, ProximitySignals } from "../Types/Type";
import { Janitor } from "@rbxts/janitor";
import Signal from "@rbxts/signal";

export class ProximtyAggregate implements IProximity {
    readonly object: ProximityPrompt;
    readonly owner: BasePart;
    readonly janitor: Janitor;
    readonly callBacks: Partial<ProximityCallBacks>;
    readonly signals: ProximitySignals;

    constructor(BasePart: BasePart, CallBacks: ProximityCallBacks | undefined) {
        this.object = new Instance("ProximityPrompt");
        this.janitor = new Janitor();
        this.owner = BasePart;

        this.object.Parent = this.owner;

        this.callBacks = CallBacks ?? {};

        this.signals = {
            onTriggered: new Signal(),
            onTriggerEnd: new Signal(),
            onPromptShown: new Signal(),
            onPromptHidden: new Signal(),
            onVisibleChange: new Signal(),
        };

        this.AddConnections();
    }

    private AddConnections() {
        this.janitor.Add(
            this.object.Triggered.Connect((player: Player) => {
                this.callBacks.onTriggered?.(player);
                this.signals.onTriggered.Fire(player);
            }),
        );
        this.janitor.Add(
            this.object.TriggerEnded.Connect((player: Player) => {
                this.callBacks.onTriggerEnd?.(player);
                this.signals.onTriggerEnd.Fire(player);
            }),
        );

        this.janitor.Add(
            this.object.PromptHidden.Connect((...args: unknown[]) => {
                this.callBacks.onPromptHidden?.(args);
                this.signals.onPromptHidden.Fire(args);
            }),
        );
        this.janitor.Add(
            this.object.PromptShown.Connect((...args: unknown[]) => {
                this.callBacks.onPromptShown?.(args);
                this.signals.onPromptShown.Fire(args);
            }),
        );
    }

    public HidePrompt() {
        const oldState = this.object.Enabled;
        this.signals.onVisibleChange.Fire(oldState, false);
        this.object.Enabled = false;
    }
    public ShowPrompt() {
        const oldState = this.object.Enabled;
        this.signals.onVisibleChange.Fire(oldState, true);
        this.object.Enabled = true;
    }
}
