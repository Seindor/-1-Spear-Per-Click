import { Pipeline } from "shared/Domain/Pipeline/Decorators/Pipeline";
import { PipelineStep } from "shared/Domain/Pipeline/Aggregates/PipelineStep";

import {
    ClientPlayerContext,
    ClientPlayerPipelineToken,
} from "shared/Types/Pipelines/ClientsPlayer/ClientPlayerPipeline";
import { PipelineContext } from "shared/Domain/Pipeline/Aggregates/PipelineContext";

import { IPlayerInterface } from "shared/Types/Gameplay/UI/IPlayerInterface";
import { ServerlistUIController } from "./ServerlistUIController";

import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";

const sharedScope = CompositionRootShared.createScope();

const eventBusAPI = sharedScope.resolve(SharedRegistry.Singletons.API.EventBusAPI);

@Pipeline({ Pipeline: ClientPlayerPipelineToken })
export class ServerlistUIStep extends PipelineStep<ClientPlayerContext> {
    public readonly Id = `ServerlistUIStep`;
    public readonly After = [`UIInitStep`];

    public miscData = new Map<string, unknown>();

    private controllers = {
        serverlist: undefined as ServerlistUIController | undefined,
    };

    public Execute(ctx: PipelineContext<ClientPlayerContext>): void {
        const id = this.Id;
        let player = ctx.Data.player;
        let playerGui = player.WaitForChild(`PlayerGui`) as PlayerGui;
        let playerInterface = playerGui.WaitForChild(`PlayerInterface`) as IPlayerInterface;

        this.controllers = {
            serverlist: new ServerlistUIController(ctx, playerInterface),
        };

        this.SetupEvents(ctx);

        ctx.Set(`${this.Id}/Controllers`, this.controllers);

        ctx.MarkCompleted(this.Id);
    }

    public SetupEvents(ctx: PipelineContext<ClientPlayerContext>) {
        const uiBus = eventBusAPI.New(ctx.Data.id, `UI`);

        uiBus.Subscribe(
            `ServerList/Show`,
            (show?: boolean) => {
                this.controllers.serverlist!.Show(show);
            },
            undefined,
            `ServerlistUIController/SetupEvents`,
        );
    }
}
