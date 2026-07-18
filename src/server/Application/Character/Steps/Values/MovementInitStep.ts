import { BootstrapStep } from "shared/Domain/Bootstrapper/Types/BootstrapTypes";
import { CharacterBootstrapContext } from "server/Application/Character/CharacterBootstrapContext";

import { Dependency } from "@flamework/core";

import { WalkSpeedHandler } from "./Movement/WalkSpeedHandler";
import { JumpPowerHandler } from "./Movement/JumpPowerHandler";

export class MovementInitStep implements BootstrapStep<CharacterBootstrapContext> {
    public name = `MovementInitStep`;
    public priority = 3;

    public execute(ctx: CharacterBootstrapContext) {
        Dependency<WalkSpeedHandler>().Init(ctx.id);
        Dependency<JumpPowerHandler>().Init(ctx.id);
    }
}
