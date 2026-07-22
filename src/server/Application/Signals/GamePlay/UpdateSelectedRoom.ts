import { OnStart, Service } from "@flamework/core";
import { ServerSignals } from "shared/Implementation/Entities/SerrverSignals";

import { CompositionRootShared } from "shared/DI/CompositionRootShared";
import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";

const sharedScope = CompositionRootShared.createScope();

const eventBusAPI = sharedScope.resolve(SharedRegistry.Singletons.API.EventBusAPI);

@Service()
export class UpdateSelectedRoom implements OnStart {
    onStart(): void {
        ServerSignals.UpdateSelectedRoom.connect((player: Player, roomId: number) => {
            let gamePlayBus = eventBusAPI.New(tostring(player.UserId), `GamePlay`);
            gamePlayBus.Fire(`UpdateSelectedRoom`, undefined, undefined, roomId);
        });
    }
}
