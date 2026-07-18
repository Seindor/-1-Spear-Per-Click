import { Workspace } from "@rbxts/services";

import { StatusAggregateType, StatusDefinition } from "../Types/StatusTypes";

import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";
import { ServerSignals } from "shared/Implementation/Entities/SerrverSignals";

let sharedScope = CompositionRootShared.createScope();

let solverAPI = sharedScope.resolve(SharedRegistry.Singletons.API.SolverAPI);
let entitiesStorageAPI = sharedScope.resolve(SharedRegistry.Singletons.API.EntitiesStorageAPI);

export const EquippedWeapon: StatusDefinition = {
    id: "EquippedWeapon",
    duration: 2.5,

    stackingPolicy: "Refresh",

    defaultBlacklist: [],

    defaultModifiers: [],

    onAdded: (actorId: string, statusInstance?: StatusAggregateType) => {
        let entity = entitiesStorageAPI.GetEntity(actorId)!;
        let characterName = entity.GetState(`CharacterName`) as string | undefined;
        let character = entity.entity as Model;

        character.SetAttribute(`EquippedWeapon`, true);
        if (!statusInstance) return;
        if (!characterName) return;
    },
    onRemoved: (actorId: string, statusInstance?: StatusAggregateType) => {
        let entity = entitiesStorageAPI.GetEntity(actorId)!;
        let characterName = entity.GetState(`CharacterName`) as string | undefined;
        let character = entity.entity as Model;
        character.SetAttribute(`EquippedWeapon`, false);

        if (!statusInstance) return;
        if (!characterName) return;

        statusInstance._janitor.Add(
            task.spawn(() => {
                ServerSignals.LaunchVFX.broadcast(characterName, `Unequip`, actorId, character);
            }),
            true,
            `Unequip_VFX`,
        );
    },
    onCheck: (actorId: string, statusInstance?: StatusAggregateType) => {},
    onApply: (actorId: string, statusInstance?: StatusAggregateType) => {
        let entity = entitiesStorageAPI.GetEntity(actorId)!;
        let characterName = entity.GetState(`CharacterName`) as string | undefined;
        let character = entity.entity as Model;

        character.SetAttribute(`EquippedWeapon`, true);

        if (!statusInstance) return;
        if (!characterName) return;
    },
};
