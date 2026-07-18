import { OnStart, Service } from "@flamework/core";

import {
    MotorMoveDurations,
    MotorName,
} from "shared/Domain/AnimationsController/Types/AnimatorTypes";
import { ServerSignals } from "shared/Implementation/Entities/SerrverSignals";
import { EasingDirection, EasingStyle } from "shared/Utilities/TweenMath";

@Service()
export class SMoveMotorSignal implements OnStart {
    onStart(): void {
        ServerSignals.MoveMotor.connect(
            (
                player: Player,
                ignorePlayer: boolean,
                character: Model,
                motorName: MotorName,
                targetOffset: CFrame,
                style: EasingStyle,
                direction: EasingDirection,
                durations?: MotorMoveDurations,
                moveName?: string,
            ) => {
                if (ignorePlayer) {
                    ServerSignals.MoveMotor.except(
                        player,
                        character,
                        motorName,
                        targetOffset,
                        style,
                        direction,
                        durations,
                        moveName,
                    );
                } else {
                    ServerSignals.MoveMotor.broadcast(
                        character,
                        motorName,
                        targetOffset,
                        style,
                        direction,
                        durations,
                        moveName,
                    );
                }
            },
        );

        ServerSignals.MoveMotorBaseOffset.connect(
            (
                player: Player,
                ignorePlayer: boolean,
                character: Model,
                motorName: MotorName,
                targetBaseOffset: CFrame,
                style: EasingStyle,
                direction: EasingDirection,
                durations?: MotorMoveDurations,
            ) => {
                if (ignorePlayer) {
                    ServerSignals.MoveMotorBaseOffset.except(
                        player,
                        character,
                        motorName,
                        targetBaseOffset,
                        style,
                        direction,
                        durations,
                    );
                } else {
                    ServerSignals.MoveMotorBaseOffset.broadcast(
                        character,
                        motorName,
                        targetBaseOffset,
                        style,
                        direction,
                        durations,
                    );
                }
            },
        );
    }
}
