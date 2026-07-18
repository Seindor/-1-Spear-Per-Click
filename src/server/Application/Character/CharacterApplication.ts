import { CharacterBootstrapContext } from "./CharacterBootstrapContext";

import { DefenseInitStep } from "./Steps/Values/DefenseInitStep";
import { MovementInitStep } from "./Steps/Values/MovementInitStep";
import { EntityInitStep } from "./Steps/EntityInitStep";

import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";

const sharedScope = CompositionRootShared.createScope();

const bootstrapperAPI = sharedScope.resolve(SharedRegistry.Singletons.API.BootstrapperAPI);

export class ServerCharacterApplication {
    private bootstrap = bootstrapperAPI.Create<CharacterBootstrapContext>("Character");

    public Init(id: string, character: Model) {
        this.bootstrap.Register(new EntityInitStep());
        this.bootstrap.Register(new DefenseInitStep());
        this.bootstrap.Register(new MovementInitStep());

        const ctx = this.buildContext(id, character);
        this.bootstrap.Run(ctx);
    }

    private buildContext(id: string, character: Model): CharacterBootstrapContext {
        return {
            id,
            character,
        };
    }
}
