import { ClientPlayerPipelineToken } from "shared/Types/Pipelines/ClientsPlayer/ClientPlayerPipeline";
import { RuntimeStatsState } from "shared/Types/Replicators/Runtime/RuntimeStatsState";

import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";

const sharedScope = CompositionRootShared.createScope();

const abilityAPI = sharedScope.resolve(SharedRegistry.Singletons.API.AbilityAPI);
const pipelineAPI = sharedScope.resolve(SharedRegistry.Singletons.API.PipelineAPI);

export function Create_Main_Click_Ability(ownerId: string) {
    let ability = abilityAPI.Create(
        {
            ownerId: ownerId,
            name: `Main_Click`,

            lastUsed: -999999,
            cooldown: 0.01,

            duration: 0.05,
            minDuration: 0.05,

            states: [`Idle`],
            types: [{ name: `Combat`, level: 1 }],

            miscData: new Map<string, any>(),
            tags: [],
        },
        {
            onStartCheck(...args) {
                return true;
            },

            onStart(...args) {
                const playerCtx = pipelineAPI.GetContext(ClientPlayerPipelineToken, ownerId);

                if (!playerCtx) return;

                let runtimeStats = playerCtx.Get(`Replicators/RuntimeStats`) as
                    | RuntimeStatsState
                    | undefined;

                if (!runtimeStats) return;

                ability.config.cooldown = runtimeStats.config.strengthGainCooldown / 5 ?? 0.05;
            },

            onEndCheck(...args) {
                return true;
            },

            onEnd(...args) {},

            onInterrupt(...args) {},
        },
    );

    return ability;
}
