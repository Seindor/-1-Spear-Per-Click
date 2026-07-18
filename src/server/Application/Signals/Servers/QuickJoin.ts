import { Dependency, OnStart, Service } from "@flamework/core";
import { ServerGatewayService } from "server/FlameworkDomain/Servers/Services/ServerGatewayService";
import { ServerSignals } from "shared/Implementation/Entities/SerrverSignals";
import { PlaceNames, Teleports } from "shared/Types/Game/ServerInfo";

@Service()
export class QuickJoin implements OnStart {
    private serverGatewayService = Dependency<ServerGatewayService>();

    onStart(): void {
        const placeId = game.PlaceId;
        const placeName = PlaceNames[placeId as keyof typeof PlaceNames];

        ServerSignals.QuickJoin.connect((player) => {
            this.serverGatewayService.QuickJoin(player, Teleports[placeName]);
        });
    }
}
