import { Dependency, OnStart, Service } from "@flamework/core";
import { ServerGatewayService } from "server/FlameworkDomain/Servers/Services/ServerGatewayService";
import { ServerSignals } from "shared/Implementation/Entities/SerrverSignals";
import { PlaceNames, Teleports } from "shared/Types/Game/ServerInfo";

@Service()
export class CreatePublicServer implements OnStart {
    private serverGatewayService = Dependency<ServerGatewayService>();

    onStart(): void {
        const placeId = game.PlaceId;
        const placeName = PlaceNames[placeId as keyof typeof PlaceNames];

        ServerSignals.CreatePublicServer.connect((player) => {
            this.serverGatewayService.CreatePublic(player, Teleports[placeName], undefined);
        });
    }
}
