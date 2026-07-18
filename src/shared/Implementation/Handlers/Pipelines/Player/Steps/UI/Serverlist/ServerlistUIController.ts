import { RunService } from "@rbxts/services";

import { IPlayerInterface } from "shared/Types/Gameplay/UI/IPlayerInterface";
import { IServerList } from "shared/Types/Gameplay/UI/IServerList";

import { PipelineContext } from "shared/Domain/Pipeline/Aggregates/PipelineContext";
import { ClientPlayerContext } from "shared/Types/Pipelines/ClientsPlayer/ClientPlayerPipeline";

import { UIButtonAggregate } from "shared/Domain/UIWrapper/Aggregates/UIButtonAggregate";
import { ClientFunctions, ClientSignals } from "shared/Implementation/Entities/ClientSignals";
import { ServerInfo } from "shared/Types/Game/ServerInfo";
import { UITemplates } from "shared/Implementation/Entities/Templates/UI";
import { IServerTemplate } from "shared/Implementation/Entities/Templates/UI/ServerList/ServerTemplate";
import { AbbreviateModule } from "shared/Utilities/AbbreviateModule";

import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";

const sharedScope = CompositionRootShared.createScope();

const uiWrapperAPI = sharedScope.resolve(SharedRegistry.Singletons.API.UIWrapperAPI);
const janitorAPI = sharedScope.resolve(SharedRegistry.Singletons.API.JanitorAPI);

export class ServerlistUIController {
    public Id = `ServerlistUIController`;

    public player: Player;
    public stringUserId: string;
    public playerInterface: IPlayerInterface;
    public serverList: IServerList;

    private servers: ServerInfo[] = [];

    private objectsData = {
        serversButtons: [] as UIButtonAggregate<IServerTemplate>[],
    };

    public _janitor = janitorAPI.CreateActor(`ServerListUIController`);

    constructor(ctx: PipelineContext<ClientPlayerContext>, playerInterface: IPlayerInterface) {
        this.player = ctx.Data.player;
        this.stringUserId = ctx.Data.id;
        this.playerInterface = playerInterface;
        this.serverList = playerInterface.WaitForChild(`ServerList`) as IServerList;

        this.Init(ctx);
    }

    private DestroyObjects() {
        for (const [, objects] of pairs(this.objectsData)) {
            for (const object of objects) {
                object.Destroy();
            }
            objects.clear();
        }
    }

    public Init(ctx: PipelineContext<ClientPlayerContext>) {
        this.Show(false);
        this.ShowRegions(false);

        this.SetupButtons();

        ctx.MarkLoaded(this.Id);
    }

    public Show(show?: boolean) {
        if (show) {
            this.serverList.Visible = show;
        } else if (show === undefined) {
            this.serverList.Visible = !this.serverList.Visible;
        }

        if (this.serverList.Visible === false) {
            this._janitor.Clear();
            this.DestroyObjects();
        } else {
            this.SetupServers();
        }
    }

    public ShowRegions(show: boolean) {
        this.serverList.RegionsContainer.Visible = show;
        this.serverList.RegionsTitle.Visible = show;
    }

    public async RefreshServers() {
        try {
            this.servers = await ClientFunctions.GetServers();
        } catch (err) {
            warn(`[RefreshServers] failed:`, err);
            this.servers = [];
        }
    }

    public GetServers(): ServerInfo[] {
        return this.servers;
    }

    public async SetupServers(update?: boolean) {
        const serversContainer = this.serverList.ServersContainer;

        if (update === true) {
            await this.RefreshServers();
        }

        const servers = this.GetServers();

        for (const serverInfo of servers) {
            let server = uiWrapperAPI.Create(UITemplates.serverListTemplates.ServerTemplate());
            let serverInstance = server.instance;

            serverInstance.ServerName.Text = `${serverInfo.firstName} ${serverInfo.secondName}`;
            serverInstance.PlayersCount.Text = `${serverInfo.players} / ${serverInfo.maxPlayers} Players`;
            serverInstance.RegionName.Text = `${serverInfo.region}, ${serverInfo.regionName}, ${serverInfo.continent_code}`;
            serverInstance.ServerTime.Text = `${AbbreviateModule.Time(os.time() - serverInfo.createdAt, 3)}`;

            server.AddCallback(`Activated`, `JoinSelectedServer`, () => {
                ClientSignals.JoinSelectedServer(serverInfo);
            });

            server.miscData.set(`ServerInfo`, serverInfo);

            this.objectsData.serversButtons.push(server);

            serverInstance.Parent = serversContainer;
        }

        this.CountServersTime();
    }

    public CountServersTime() {
        let janitor = this._janitor.Create(`CountServersTime`, true);

        janitor.Add(
            RunService.Heartbeat.Connect(() => {
                for (const serverButton of this.objectsData.serversButtons) {
                    const serverButtonInstance = serverButton.instance as IServerTemplate;
                    const serverInfo = serverButton.miscData.get(`ServerInfo`)! as ServerInfo;

                    serverButtonInstance.ServerTime.Text = `${AbbreviateModule.Time(os.time() - serverInfo.createdAt, 3)}`;
                }
            }),
            "Disconnect",
        );
    }

    public SetupQuickJoinButton() {
        let button = uiWrapperAPI.Create(this.serverList.BottomButtons.QuickJoin);

        button.AddCallback(`Activated`, `QuickJoin`, () => {
            ClientSignals.QuickJoin.fire();
        });
    }

    public SetupCreatePublicButton() {
        let button = uiWrapperAPI.Create(this.serverList.BottomButtons.CreatePublic);

        button.AddCallback(`Activated`, `QuickJoin`, () => {
            ClientSignals.CreatePublicServer.fire();
        });
    }

    public SetupButtons() {
        this.SetupQuickJoinButton();
        this.SetupCreatePublicButton();
    }
}
