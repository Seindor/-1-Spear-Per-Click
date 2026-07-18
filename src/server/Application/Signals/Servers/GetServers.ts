import { Dependency, OnStart, Service } from "@flamework/core";
import { ServerBrowserService } from "server/FlameworkDomain/Servers/Services/ServerBrowserService";
import { ServerFunctions, ServerSignals } from "shared/Implementation/Entities/SerrverSignals";
import { PlaceNames, Teleports } from "shared/Types/Game/ServerInfo";

@Service()
export class GetServers implements OnStart {
    private serverBrowserService = Dependency<ServerBrowserService>();

    onStart(): void {
        const placeId = game.PlaceId;
        const placeName = PlaceNames[placeId as keyof typeof PlaceNames];

        ServerFunctions.GetServers.setCallback(() => {
            print(`TRYING GET SERVERS`);
            try {
                const placeId = Teleports[placeName];
                let servers = this.serverBrowserService.GetServers(placeId) ?? [];
                print(`GetServers completed`);
                return servers;
            } catch (e) {
                warn("GetServers crashed:", e);
                return [];
            }
        });
    }
}
