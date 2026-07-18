/* AUTO-GENERATED. DO NOT EDIT. */
import { token as __token0 } from "../Providers/Server/Singletons/API/DataStoreAPIProvider/DataStoreAPIToken";
import { token as __token1 } from "../Providers/Server/Singletons/API/GameEffectsAPIProvider/GameEffectsAPIToken";
import { token as __token2 } from "../Providers/Server/Singletons/API/ServerAtomAPIProvider/ServerAtomAPIToken";
import { token as __token3 } from "../Providers/Server/Singletons/API/StatusEffectsAPIProvider/StatusEffectsAPIToken";

export const ServerRegistry = {
  Singletons: {
    API: {
      DataStoreAPI: __token0,
      GameEffectsAPI: __token1,
      ServerAtomAPI: __token2,
      StatusEffectsAPI: __token3,
    },
  },
} as const;

export type ServerRegistryShape = typeof ServerRegistry;
