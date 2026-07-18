import { Controller, OnStart } from "@flamework/core";
import { PipelineContext } from "shared/Domain/Pipeline/Aggregates/PipelineContext";
import { ClientPlayerContext } from "shared/Types/Pipelines/ClientsPlayer/ClientPlayerPipeline";

import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";
import { ReplicatedStatus, StatusEffectsState } from "shared/Types/GlobalStatusEffectsTypes";

const sharedScope = CompositionRootShared.createScope();

const replicatedStatusEffectsAPI = sharedScope.resolve(
    SharedRegistry.Singletons.API.ReplicatedStatusEffectsAPI,
);
const clientAtomAPI = sharedScope.resolve(SharedRegistry.Singletons.API.ClientAtomAPI);

export class StatusEffectsReplicationController {
    public Id = `StatusEffectsReplicationController`;

    constructor(ctx: PipelineContext<ClientPlayerContext>) {
        this.Init(ctx);
    }

    public Init(ctx: PipelineContext<ClientPlayerContext>) {
        clientAtomAPI.Subscribe<StatusEffectsState, ReplicatedStatus[]>(
            ctx.Data.id,
            `StatusEffectsReplicationController`,
            `StatusEffects`,
            `${ctx.Data.id}`,
            (value) => {
                replicatedStatusEffectsAPI.Set(ctx.Data.id, value ?? []);
            },
        );

        ctx.MarkLoaded(this.Id);
    }
}
