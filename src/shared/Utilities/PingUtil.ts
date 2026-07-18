import { Players } from "@rbxts/services";

import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";

const sharedScope = CompositionRootShared.createScope();

const entitiesStorageAPI = sharedScope.resolve(SharedRegistry.Singletons.API.EntitiesStorageAPI);

class Class_PingUitl {
    public GetFixedPing(_entity: string | Instance, clamp = 0.15 as number): number {
        let entity = entitiesStorageAPI.GetEntity(_entity)!;
        let character = entity.entity as Model;

        let ownerPing = 0;

        if (Players.GetPlayerFromCharacter(character)) {
            ownerPing = math.clamp(
                Players.GetPlayerFromCharacter(character)!.GetNetworkPing() * 1.125,
                0,
                clamp,
            );
        }

        return ownerPing;
    }

    public GetRealPing(_entity: string | Instance): number {
        let entity = entitiesStorageAPI.GetEntity(_entity)!;
        let character = entity.entity as Model;

        let ownerPing = 0;

        if (Players.GetPlayerFromCharacter(character)) {
            ownerPing = Players.GetPlayerFromCharacter(character)!.GetNetworkPing() * 1.125;
        }

        return ownerPing;
    }

    public GetNetworkPing(_entity: string | Instance): number {
        let entity = entitiesStorageAPI.GetEntity(_entity)!;
        let character = entity.entity as Model;

        let ownerPing = 0;

        if (Players.GetPlayerFromCharacter(character)) {
            ownerPing = Players.GetPlayerFromCharacter(character)!.GetNetworkPing();
        }

        return ownerPing;
    }
}

export const PingUitl = new Class_PingUitl();
