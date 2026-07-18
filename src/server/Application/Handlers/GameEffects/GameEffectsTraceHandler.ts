import { Service, OnStart } from "@flamework/core";

import type {
    IGameEffectsLogger,
    GameEffectsLogEvent,
} from "server/Domain/GameEffectsQueue/Types/GameEffectsHookTypes";

import { ServerRegistry } from "server/DI/Generated/ServerRegistry";
import { CompositionRootServer } from "server/DI/CompositionRootServer";

import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";

import type { TraceClipAPI } from "shared/Domain/TraceClip/API/TraceClipAPI";
import type { GameEffectsAPI } from "server/Domain/GameEffectsQueue/API/GameEffectsApi";

class TraceGameEffectsLogger implements IGameEffectsLogger {
    constructor(private trace: TraceClipAPI) {}

    log(event: GameEffectsLogEvent): void {
        this.trace.log(event.ownerId, "Proc", event.message, {
            stepId: event.stepId,
            sourceId: event.sourceId,
            targetId: event.targetId,
        });
    }
}

@Service()
export class GameEffectsTraceHandler implements OnStart {
    onStart(): void {
        const serverScope = CompositionRootServer.createScope();
        const sharedScope = CompositionRootShared.createScope();

        const traceApi = sharedScope.resolve(
            SharedRegistry.Singletons.API.TraceClipAPI,
        ) as TraceClipAPI;
        const gameEffectsApi = serverScope.resolve(
            ServerRegistry.Singletons.API.GameEffectsAPI,
        ) as GameEffectsAPI;

        const logger = new TraceGameEffectsLogger(traceApi);

        gameEffectsApi.configure(undefined, logger);

        traceApi.log(
            "server",
            "Action",
            "GameEffectsTraceHandler wired GameEffects logger -> TraceClip",
        );
    }
}
