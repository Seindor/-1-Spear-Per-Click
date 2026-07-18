import { Flamework } from "@flamework/core";

Flamework.addPaths("src/server/Application");
Flamework.addPaths("src/server/Implementation");
Flamework.addPaths(`src/server/FlameworkDomain`);

Flamework.ignite();
