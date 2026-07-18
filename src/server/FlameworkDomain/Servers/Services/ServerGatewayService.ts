import { TeleportService, Players } from "@rbxts/services";
import { Dependency, OnStart, Service } from "@flamework/core";

import { ServerBrowserService } from "./ServerBrowserService";
import { ServerInfo } from "shared/Types/Game/ServerInfo";
import type { GameTeleportData } from "shared/Types/Game/TeleportDatas/TeleportData";
import { HttpServerInfo } from "server/Types/Game/ServerInfo";

type ServerGeo = {
    countryCode: string;
    region: string;
    regionName: string;
};

@Service()
export class ServerGatewayService {
    private browser = Dependency<ServerBrowserService>();

    private serverInfo!: ServerInfo;

    public AddServerInfo(serverInfo: ServerInfo) {
        this.serverInfo = serverInfo;
    }

    public QuickJoin(player: Player, placeId: number) {
        const server = this.findBestServer(player, placeId);

        if (server) {
            let succes = this.joinServer(player, server, {
                fromQuickJoin: true,
                createdVia: "QuickJoin",
            });

            if (succes) return;
        }

        this.createAndJoin(player, placeId, "Public", "Game", {
            fromQuickJoin: true,
            createdVia: "QuickJoin",
        });
    }

    public JoinSelected(player: Player, server: ServerInfo, teleportData?: GameTeleportData) {
        this.joinServer(player, server, teleportData);
    }

    public CreatePublic(player: Player, placeId: number, teleportData?: GameTeleportData) {
        this.createAndJoin(player, placeId, "Public", "Game", teleportData);
    }

    public CreatePrivate(player: Player, placeId: number, teleportData?: GameTeleportData) {
        this.createAndJoin(player, placeId, "Private", tostring(player.UserId), teleportData);
    }

    public Rejoin(player: Player) {
        const last = this.getLastServer(player);
        if (!last) return;

        this.joinServer(player, last, {
            createdVia: "Rejoin",
        });
    }

    private scoreServer(server: ServerInfo, playerGeo: ServerGeo): number {
        let score = 0;

        if (server.region === playerGeo.region) {
            score += 1000;
        }

        if (server.countryCode === playerGeo.countryCode) {
            score += 500;
        }

        const fill = server.players / server.maxPlayers;
        score += (1 - fill) * 200;

        const ageMinutes = (os.time() - server.createdAt) / 60;
        score += math.max(0, 10 - ageMinutes);

        return score;
    }

    private findBestServer(player: Player, placeId: number) {
        while (!this.serverInfo) {
            task.wait(0.5);
        }

        const servers = this.browser.GetServers(placeId);

        const joinable = servers.filter((s) => this.isJoinable(s));

        if (joinable.size() === 0) return undefined;

        let best = joinable[0];
        let bestScore = this.scoreServer(best, this.serverInfo);

        for (const server of joinable) {
            const score = this.scoreServer(server, this.serverInfo);
            if (score > bestScore) {
                best = server;
                bestScore = score;
            }
        }

        return best;
    }

    private joinServer(
        player: Player,
        server: ServerInfo,
        teleportData?: GameTeleportData,
    ): boolean {
        if (!server.accessCode) {
            warn("Missing accessCode:", server);
            return false;
        }

        const accesCode = server.accessCode;

        const [ok, err] = pcall(() => {
            TeleportService.TeleportToPrivateServer(
                server.placeId,
                accesCode,
                [player],
                undefined,
                teleportData as any,
            );
        });

        if (!ok) {
            warn("Teleport failed:", err);
            return false;
        }

        return true;
    }

    private createAndJoin(
        player: Player,
        placeId: number,
        visibility: "Public" | "Private",
        owner: string,
        teleportData?: GameTeleportData,
    ) {
        const [accessCode] = TeleportService.ReserveServer(placeId);

        if (teleportData !== undefined) {
            teleportData.accessCode = accessCode;
        }

        const server: ServerInfo = {
            owner,
            jobId: game.JobId,
            accessCode: accessCode,
            placeId,

            createdAt: os.time(),

            firstName: "Server",
            secondName: "X",

            continent_code: this.serverInfo.continent_code,
            countryCode: this.serverInfo.countryCode,
            region: this.serverInfo.region,
            regionName: this.serverInfo.regionName,

            players: 1,
            maxPlayers: Players.MaxPlayers,

            locked: false,
            visibility,
        };

        this.joinServer(player, server, teleportData);
    }

    private isJoinable(server: ServerInfo): boolean {
        if (server.locked) return false;
        if (server.players >= server.maxPlayers) return false;
        return true;
    }

    private getLastServer(player: Player): ServerInfo | undefined {
        return undefined;
    }
}
