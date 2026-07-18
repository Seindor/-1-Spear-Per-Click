import { ReplicatedStorage } from "@rbxts/services";
import { SoundService } from "@rbxts/services";
import { ISounds } from "shared/Types/Assets/Sounds";

let Assets = ReplicatedStorage.WaitForChild("Assets") as Folder;
let Sounds = Assets.WaitForChild("Sounds") as ISounds;

type SoundPaths<T, Prefix extends string = ""> = {
    [K in keyof T]: T[K] extends Sound
        ? Prefix extends ""
            ? K & string
            : `${Prefix}/${K & string}`
        : T[K] extends object
          ? SoundPaths<T[K], Prefix extends "" ? K & string : `${Prefix}/${K & string}`>
          : never;
}[keyof T];

type SoundAtPath<T, Path extends string> = Path extends `${infer Head}/${infer Tail}`
    ? Head extends keyof T
        ? SoundAtPath<T[Head], Tail>
        : never
    : Path extends keyof T
      ? T[Path]
      : never;

export type AllSoundPaths = SoundPaths<ISounds>;

class ClassSoundUtils {
    public CreateSound<T extends AllSoundPaths>(path: T): SoundAtPath<ISounds, T> {
        const parts = path.split("/");
        let current: Instance = Sounds;

        for (const part of parts) {
            current = current.WaitForChild(part);
        }

        return (current as Sound).Clone() as SoundAtPath<ISounds, T>;
    }

    public PlaySound(sound: Sound, playOnce?: boolean, soundGroup?: "Music" | "SFXs") {
        if (soundGroup) {
            sound.Parent = SoundService.FindFirstChild(soundGroup)!;
        }

        sound.Play();

        if (playOnce) {
            sound.Ended.Once(() => {
                task.wait(0.5);
                sound.Destroy();
            });
        }
    }
}

export const SoundsUtil = new ClassSoundUtils();
