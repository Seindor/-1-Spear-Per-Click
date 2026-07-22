import { OnStart, Service } from "@flamework/core";
import { ServerSignals } from "shared/Implementation/Entities/SerrverSignals";

import { CompositionRootShared } from "shared/DI/CompositionRootShared";
import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";

const sharedScope = CompositionRootShared.createScope();

const eventBusAPI = sharedScope.resolve(SharedRegistry.Singletons.API.EventBusAPI);

@Service()
export class WinsPadTouched implements OnStart {
    onStart(): void {
        ServerSignals.WinsPadTouched.connect((player: Player, padId, roomId: number) => {
            let gamePlayBus = eventBusAPI.New(tostring(player.UserId), `GamePlay`);
            gamePlayBus.Fire(`WinsPadTouched`, undefined, undefined, padId, roomId);
        });
    }
}
