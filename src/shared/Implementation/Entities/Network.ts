import { Networking } from "@flamework/networking";
import {
    MotorMoveDurations,
    MotorName,
    R15MotorName,
    R6MotorName,
} from "shared/Domain/AnimationsController/Types/AnimatorTypes";
import { Gender } from "shared/Types/Database/Gender";
import { ISlotRecievedInfo } from "shared/Types/Database/PlayerData";
import { Race } from "shared/Types/Database/Race";
import { AbilityNetworkMethod } from "shared/Types/Game/Abilities/AbilityPackTypes";
import { ServerInfo } from "shared/Types/Game/ServerInfo";
import { GameTeleportData } from "shared/Types/Game/TeleportDatas/TeleportData";
import { AllSoundPaths } from "shared/Utilities/SoundsUtil";
import { EasingDirection, EasingStyle } from "shared/Utilities/TweenMath";

export interface PlugBroadcastData {
    Size: Vector3;
    CFrame: CFrame;
    Material: Enum.Material;
    Color: Color3;
    MaterialVariant: string;
    Transparency: number;
    Reflectance: number;
}

export interface CutterData {
    Size: Vector3;
    CFrame: CFrame;
}

export interface ServerToClientSignals {
    SetupMovementAnimations(ownerId: string, character: Model): void;
    SetupAbility(abilityData: { Path: string; Name: string; KeyCode: string; Type: string }): void;
    Ability(
        abilityName: string,
        abilityType: string,
        method: AbilityNetworkMethod,
        check?: boolean,
        ...args: unknown[]
    ): void;
    RemoveAbility(abilityName: string): void;

    LaunchVFX(vfx: string, method: string, ...args: unknown[]): void;
    PlaySound(
        sound: AllSoundPaths,
        soundParent: BasePart | ("SFXs" | "Music"),
        playOnce?: boolean,
    ): void;

    MoveMotor(
        character: Model,
        motorName: MotorName,
        targetOffset: CFrame,
        style: EasingStyle,
        direction: EasingDirection,
        durations?: MotorMoveDurations,
        moveName?: string,
    ): void;

    MoveMotorBaseOffset(
        character: Model,
        motorName: MotorName,
        targetBaseOffset: CFrame,
        style: EasingStyle,
        direction: EasingDirection,
        durations?: MotorMoveDurations,
    ): void;

    AtomSync(payload: any): void;
}

export interface ClientToServerSignals {
    Ability(
        abilityName: string,
        abilityType: string,
        method: AbilityNetworkMethod,
        ...args: unknown[]
    ): void;

    MoveMotor(
        ignorePlayer: boolean,
        character: Model,
        motorName: MotorName,
        targetOffset: CFrame,
        style: EasingStyle,
        direction: EasingDirection,
        durations?: MotorMoveDurations,
        moveName?: string,
    ): void;

    MoveMotorBaseOffset(
        ignorePlayer: boolean,
        character: Model,
        motorName: MotorName,
        targetBaseOffset: CFrame,
        style: EasingStyle,
        direction: EasingDirection,
        durations?: MotorMoveDurations,
    ): void;

    RequestHydrate(): void;
    AtomHydrated(): void;

    //Servers

    QuickJoin(): void;
    JoinSelectedServer(serverInfo: ServerInfo): void;

    CreatePublicServer(): void;

    //Data

    CreateCharacterSlot(
        name: string,
        recieveMethod: ISlotRecievedInfo,
        race: Race,
        gender: Gender,
    ): void;

    SetupSlot(slotId: string, name: string, gender: Gender, race: Race): void;

    SelectCharacterSlot(slot: string): void;
}

export interface ServerToClientFunctions {}
export interface ClientToServerFunctions {
    //Servers
    GetServers(): ServerInfo[];

    //Filtering
    GetFilteredSlotName(slotName: string): {
        filtered: boolean;
        name: string;
    };
}

export const GlobalSignals = Networking.createEvent<ClientToServerSignals, ServerToClientSignals>();
export const GlobalFunctions = Networking.createFunction<
    ClientToServerFunctions,
    ServerToClientFunctions
>();
