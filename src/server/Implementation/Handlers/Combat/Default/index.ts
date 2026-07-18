import { Default_Dodge_Effect } from "./Effects/Default_Dodge";
import { Default_M1_Damage_Effect } from "./Effects/Default_M1_Damage";
import { Default_Parry_Effect } from "./Effects/Default_Parry";
import { Default_M1_Resolver } from "./Resolvers/Default_M1";

export const DefaultCombat = (ownerId: string) => {
    Default_M1_Resolver(ownerId);

    Default_M1_Damage_Effect(ownerId);
    Default_Parry_Effect(ownerId);

    Default_Dodge_Effect(ownerId);
};
