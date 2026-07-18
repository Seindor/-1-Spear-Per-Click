import { Controller, OnStart } from "@flamework/core";
import { ClientSignals } from "shared/Implementation/Entities/ClientSignals";
import { SoundsUtil } from "shared/Utilities/SoundsUtil";

@Controller()
export class PlaySoundSignal implements OnStart {
    onStart(): void {
        ClientSignals.PlaySound.connect(
            (sound, soundParent: BasePart | ("SFXs" | "Music"), playOnce?: boolean) => {
                let soundToPlay = SoundsUtil.CreateSound(sound);

                if (soundParent === "SFXs" ?? soundParent === "Music") {
                    SoundsUtil.PlaySound(soundToPlay, playOnce, soundParent as "SFXs" | "Music");
                } else {
                    soundToPlay.Parent = soundParent as BasePart;
                    SoundsUtil.PlaySound(soundToPlay, playOnce);
                }
            },
        );
    }
}
