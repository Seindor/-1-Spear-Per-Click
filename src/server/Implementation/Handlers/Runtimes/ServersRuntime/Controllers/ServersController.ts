import { HttpService, MemoryStoreService, RunService, Players } from "@rbxts/services";

import { RuntimeController } from "shared/Domain/Runtime/Components/RuntimeController";
import { generateServerName } from "shared/Implementation/Entities/Templates/Gameplay/ServerNames";
import { ServerInfo } from "shared/Types/Game/ServerInfo";
import { HttpServerInfo, ServersSortedMapKey } from "server/Types/Game/ServerInfo";
import { PlaceNames } from "shared/Types/Game/ServerInfo";
import { ServerContext } from "shared/Types/Runtime/ServerRuntime";

import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";
import { Dependency } from "@flamework/core";
import { ServerGatewayService } from "server/FlameworkDomain/Servers/Services/ServerGatewayService";
import { GameTeleportData } from "shared/Types/Game/TeleportDatas/TeleportData";

const sharedScope = CompositionRootShared.createScope();

const janitorAPI = sharedScope.resolve(SharedRegistry.Singletons.API.JanitorAPI);

export class ServersController extends RuntimeController<ServerContext> {
    public readonly Name = "ServersController";

    private blacklist = [] as string[];
    public serverInfo!: ServerInfo;
    public serverStore = MemoryStoreService.GetSortedMap(`${game.PlaceId}_${ServersSortedMapKey}`);
    public updateTime = 30;
    public janitor = janitorAPI.Create(`Game`, `Server`);

    protected OnInit() {
        if (this.CheckBlacklist() === true) return;

        this.serverInfo = this.buildServerInfo();

        this.Publish();

        game.BindToClose(() => {
            this.Remove();
        });

        Dependency<ServerGatewayService>().AddServerInfo(this.serverInfo);

        this.janitor.Add(
            task.spawn(() => {
                while (true) {
                    task.wait(this.updateTime);
                    this.UpdatePlayers();
                }
            }),
            true,
            `Server/Update`,
        );
    }

    private buildServerInfo(): ServerInfo {
        const httpServerInfo = this.gethttpServerInfo();
        const serverName = generateServerName();

        const teleportData = this.runtime.GetMeta(`TeleportData`) as GameTeleportData | undefined;

        return {
            owner: tostring(teleportData?.owner ?? "Game"),

            createdAt: os.time(),
            jobId: tostring(game.JobId),
            accessCode: tostring(teleportData?.accessCode ?? undefined),
            placeId: game.PlaceId,

            continent_code: tostring(httpServerInfo.continent_code ?? "UN"),
            countryCode: tostring(httpServerInfo.country_code ?? "UN"),
            region: tostring(httpServerInfo.region ?? "Unknown"),
            regionName: tostring(httpServerInfo.region_code ?? "Unknown"),

            firstName: serverName.firstName,
            secondName: serverName.secondName,

            players: Players.GetPlayers().size(),
            maxPlayers: Players.MaxPlayers,

            locked: false,
            visibility: teleportData?.visibility ?? "Public",
        };
    }

    private gethttpServerInfo(): HttpServerInfo {
        const fallback: HttpServerInfo = {
            country_code: "UN",
            region: "Unknown",
            region_code: "UN",
        } as HttpServerInfo;

        const startTime = os.clock();
        const timeout = 30;

        const endpoints = ["https://ipapi.co/json/", "https://ipwho.is/"];

        let attempt = 0;

        while (os.clock() - startTime < timeout) {
            const url = endpoints[attempt % endpoints.size()];

            const [success, result] = pcall(() => {
                const response = HttpService.GetAsync(url);
                const geo = HttpService.JSONDecode(response) as HttpServerInfo;

                // normalize ipwho.is format → ipapi format
                if (url === "https://ipwho.is/") {
                    return {
                        country_code: tostring(geo.country_code),
                        region: tostring(geo.region),
                        region_code: tostring(geo.region_code) ?? ``,
                    };
                }

                return geo;
            });

            if (success && result) {
                warn(
                    `[Geo] Done, recivieved: `,
                    result,
                    result.country_code,
                    result.region,
                    result.region_code,
                );
                return result as HttpServerInfo;
            }

            warn(`[Geo] Failed from ${url}: ${result}`);

            attempt++;
            task.wait(3);
        }

        warn("[Geo] timeout reached → fallback used");

        return fallback;
    }

    public Publish() {
        const key = game.JobId;
        print(key);
        this.serverStore.SetAsync(key, this.serverInfo, 600, this.serverInfo.createdAt);
    }

    public Remove() {
        const key = game.JobId;
        this.serverStore.RemoveAsync(key);
    }

    public CheckBlacklist(): boolean {
        const placeId = game.PlaceId;
        const placeName = PlaceNames[placeId as keyof typeof PlaceNames];

        if (RunService.IsStudio()) return true;

        if (this.blacklist.includes(placeName)) {
            return true;
        }

        return false;
    }

    public UpdatePlayers() {
        this.serverInfo.players = Players.GetPlayers().size();
        this.Publish();
    }

    protected OnDestroy() {
        const key = game.JobId;
        this.serverStore.RemoveAsync(key);
    }

    public GetServerInfo(): ServerInfo {
        return this.serverInfo;
    }
}
