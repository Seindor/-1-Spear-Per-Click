import { ServerRegistry } from "server/DI/Generated/ServerRegistry";
import { CompositionRootServer } from "server/DI/CompositionRootServer";
import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";

const serverScope = CompositionRootServer.createScope();
const sharedScope = CompositionRootShared.createScope();

const statusEffectsAPI = serverScope.resolve(ServerRegistry.Singletons.API.StatusEffectsAPI);
const traceClipAPI = sharedScope.resolve(SharedRegistry.Singletons.API.TraceClipAPI);

export class StatusEffectsLog {
    constructor(ownerId: string) {
        statusEffectsAPI.Subscribe(
            ownerId,
            `All`,
            (event, status) => {
                if (event === "Added") {
                    traceClipAPI.log(
                        ownerId,
                        `Status`,
                        `${status.id} ${event} for ${status.duration} seconds.`,
                        undefined,
                        {
                            StatusEffect: status,
                        },
                    );
                } else {
                    traceClipAPI.log(ownerId, `Status`, `${status.id} ${event}.`, undefined, {
                        StatusEffect: status,
                    });
                }
            },
            `${ownerId}_Log`,
        );
    }
}
