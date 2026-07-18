import { Controller, OnStart } from "@flamework/core";
import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";
import { Players } from "@rbxts/services";

const sharedScope = CompositionRootShared.createScope();

import {
    MotorMoveDurations,
    MotorName,
} from "shared/Domain/AnimationsController/Types/AnimatorTypes";
import { ClientSignals } from "shared/Implementation/Entities/ClientSignals";
import { EasingDirection, EasingStyle } from "shared/Utilities/TweenMath";

@Controller()
export class SMoveMotorSignal implements OnStart {
    onStart(): void {
        ClientSignals.MoveMotor.connect(
            (
                character: Model,
                motorName: MotorName,
                targetOffset: CFrame,
                style: EasingStyle,
                direction: EasingDirection,
                durations?: MotorMoveDurations,
                moveName?: string,
            ) => {
                if (!character) {
                    return;
                }

                let id =
                    tostring(Players.GetPlayerFromCharacter(character)) ??
                    character.GetAttribute("id") ??
                    tostring(0);

                let animationsAPI = sharedScope.resolve(
                    SharedRegistry.Singletons.API.AnimationsAPI,
                );

                let animator = animationsAPI.CreateAnimator(
                    { Character: character },
                    "Main",
                    tostring(id),
                );

                animator.MoveMotor(motorName, targetOffset, style, direction, durations, moveName);
            },
        );

        ClientSignals.MoveMotorBaseOffset.connect(
            (
                character: Model,
                motorName: MotorName,
                targetBaseOffset: CFrame,
                style: EasingStyle,
                direction: EasingDirection,
                durations?: MotorMoveDurations,
            ) => {
                if (!character) {
                    return;
                }

                let id =
                    tostring(Players.GetPlayerFromCharacter(character)) ??
                    character.GetAttribute("id") ??
                    tostring(0);

                let animationsAPI = sharedScope.resolve(
                    SharedRegistry.Singletons.API.AnimationsAPI,
                );

                let animator = animationsAPI.CreateAnimator(
                    { Character: character },
                    "Main",
                    tostring(id),
                );

                animator.MoveMotorBaseOffset(
                    motorName,
                    targetBaseOffset,
                    style,
                    direction,
                    durations,
                );
            },
        );
    }
}
