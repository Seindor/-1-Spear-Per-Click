import {
    ClientPlayerContext,
    ClientPlayerPipelineToken,
} from "shared/Types/Pipelines/ClientsPlayer/ClientPlayerPipeline";
import { PipelineContext } from "shared/Domain/Pipeline/Aggregates/PipelineContext";

import { Pipeline } from "shared/Domain/Pipeline/Decorators/Pipeline";
import { PipelineStep } from "shared/Domain/Pipeline/Aggregates/PipelineStep";

import { ClientSignals } from "shared/Implementation/Entities/ClientSignals";

import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";
import { ReplicatedStatus, StatusEffectsState } from "shared/Types/GlobalStatusEffectsTypes";
import { StatusEffectsReplicationController } from "./StatusEffectsReplicationController";
import { Replicators } from "./Replicators";

const sharedScope = CompositionRootShared.createScope();

const clientAtomAPI = sharedScope.resolve(SharedRegistry.Singletons.API.ClientAtomAPI);

@Pipeline({ Pipeline: ClientPlayerPipelineToken })
export class LoadReplicatorsStep extends PipelineStep<ClientPlayerContext> {
    public readonly Id = `LoadReplicatorsStep`;

    public controllers!: {
        replicators: Replicators;
        statusEffectsReplicationController: StatusEffectsReplicationController;
    };

    public Execute(ctx: PipelineContext<ClientPlayerContext>): void {
        const id = this.Id;
        let player = ctx.Data.player;

        clientAtomAPI.WaitForChannel(`RuntimeStats`);
        clientAtomAPI.WaitForChannel(`RuntimeEquipment`);
        clientAtomAPI.WaitForChannel(`PlayerData`);
        clientAtomAPI.WaitForChannel(`StatusEffects`);
        ClientSignals.RequestHydrate.fire();

        this.controllers = {
            replicators: new Replicators(ctx),
            statusEffectsReplicationController: new StatusEffectsReplicationController(ctx),
        };

        ctx.Set(`${this.Id}/Replicators`, this.controllers.replicators);
        ctx.Set(`${this.Id}/Controllers`, this.controllers);

        ctx.MarkCompleted(this.Id);
    }
}
