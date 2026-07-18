import { Controller, OnStart } from "@flamework/core";

import { ClientSignals } from "shared/Implementation/Entities/ClientSignals";

import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";

const sharedScope = CompositionRootShared.createScope();

const clientAtomAPI = sharedScope.resolve(SharedRegistry.Singletons.API.ClientAtomAPI);

@Controller()
export class AtomSync implements OnStart {
    onStart(): void {
        ClientSignals.AtomSync.connect((payload) => {
            clientAtomAPI.Receive(payload);
        });
    }
}
