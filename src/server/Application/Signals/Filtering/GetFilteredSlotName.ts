import { TextService } from "@rbxts/services";

import { OnStart, Service } from "@flamework/core";
import { ServerFunctions } from "shared/Implementation/Entities/SerrverSignals";
import { PingUitl } from "shared/Utilities/PingUtil";

interface FilteredSlotName {
    filtered: boolean;
    name: string;
}

@Service()
export class GetFilteredSlotName implements OnStart {
    public onStart(): void {
        ServerFunctions.GetFilteredSlotName.setCallback((player, slotName) => {
            return this.GetFilteredSlotName(player, slotName);
        });
    }

    public async GetFilteredSlotName(player: Player, slotName: string): Promise<FilteredSlotName> {
        if (!typeIs(slotName, "string")) {
            return {
                filtered: false,
                name: "",
            };
        }

        const cleanName = slotName.gsub("[^A-Za-z]", "")[0];

        if (cleanName !== slotName) {
            return {
                filtered: false,
                name: cleanName,
            };
        }

        const filterResult = await TextService.FilterStringAsync(
            cleanName,
            player.UserId,
            Enum.TextFilterContext.PublicChat,
        );

        const filtered = await filterResult.GetNonChatStringForBroadcastAsync();

        const accepted = filtered === cleanName;

        return {
            filtered: accepted,
            name: filtered,
        };
    }
}
