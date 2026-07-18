import { BootstrapStep } from "shared/Domain/Bootstrapper/Types/BootstrapTypes";
import { CharacterBootstrapContext } from "server/Application/Character/CharacterBootstrapContext";

import { Dependency } from "@flamework/core";

import { HealthHandler } from "./Defense/HealthHandler";
import { PostureHandler } from "./Defense/PostureHandler";

export class DefenseInitStep implements BootstrapStep<CharacterBootstrapContext> {
    public name = `DefenseInitStep`;
    public priority = 2;

    public execute(ctx: CharacterBootstrapContext) {
        Dependency<HealthHandler>().Init(ctx.id);
        Dependency<PostureHandler>().Init(ctx.id);
    }
}
