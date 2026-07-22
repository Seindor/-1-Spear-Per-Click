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

    public controllers = new Map<string, object>();

    public Execute(ctx: PipelineContext<ClientPlayerContext>): void {
        const id = this.Id;
        let player = ctx.Data.player;

        clientAtomAPI.WaitForChannel(`PlayerData`);
        clientAtomAPI.WaitForChannel(`StatusEffects`);
        clientAtomAPI.WaitForChannel(`RuntimeStats`);
        clientAtomAPI.WaitForChannel(`RuntimeEquipment`);
        clientAtomAPI.WaitForChannel(`RuntimeGamePlay`);

        for (const module of script.GetChildren() as ModuleScript[]) {
            const required = require(module) as Record<string, defined>;

            const [requiredName, requiredClass] = next(required)!;

            const Controller = requiredClass as {
                new (ctx: PipelineContext<ClientPlayerContext>): { id: string } & object;
            };

            let importedController = new Controller(ctx);

            if (importedController.id === `Replicators`) {
                ctx.Set(`${this.Id}/Replicators`, importedController);
            }

            this.controllers.set(importedController.id, importedController);
        }

        ClientSignals.RequestHydrate.fire();

        ctx.Set(`${this.Id}/Controllers`, this.controllers);

        ctx.MarkCompleted(this.Id);
    }
}
