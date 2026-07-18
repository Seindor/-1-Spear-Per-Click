import { OnStart, Service } from "@flamework/core";
import { ServerSignals } from "shared/Implementation/Entities/SerrverSignals";

import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";
import { AbilityNetworkMethod } from "shared/Types/Game/Abilities/AbilityPackTypes";
import { RuntimeEquipmentControllers } from "server/Implementation/Handlers/Runtimes/SessionRuntime/Controllers/RuntimeEquipment";
import { ServerAbilityHandler } from "server/Implementation/Handlers/Abilities/ServerAbilityHandler";

let sharedScope = CompositionRootShared.createScope();

let runtimeAPI = sharedScope.resolve(SharedRegistry.Singletons.API.RuntimeAPI);

@Service()
export class AbilitiesSignal implements OnStart {
    onStart(): void {
        ServerSignals.Ability.connect(
            (
                player: Player,
                abilityName: string,
                abilityType: string,
                method: AbilityNetworkMethod,
                ...args: unknown[]
            ) => {
                let playerStringUserId = tostring(player.UserId);

                let equipmentRuntime = runtimeAPI.Get<RuntimeEquipmentControllers>(
                    playerStringUserId,
                    `Equipment`,
                );

                if (!equipmentRuntime) {
                    warn(`Equipment Runtime is nil for ${playerStringUserId}`);
                    return;
                }

                let serverAbilityHanlder = equipmentRuntime.GetMeta(
                    `serverAbilityHanlder`,
                ) as ServerAbilityHandler;

                if (!serverAbilityHanlder) {
                    warn(`ServerAbilityHandler is nil for ${playerStringUserId}`);
                    return;
                }

                serverAbilityHanlder.HandleNetworkCommand(abilityName, method);
            },
        );
    }
}
