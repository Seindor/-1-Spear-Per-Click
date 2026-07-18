import { Container } from "shared/DI/Container";
import { registerDependencies } from "shared/DI/RegisterDependencies";
import { ServerScriptService } from "@rbxts/services";

export const CompositionRootServer = new Container();

const serverProviders = ServerScriptService.WaitForChild("TS")
    .WaitForChild("DI")
    .WaitForChild("Providers")
    .WaitForChild("Server") as Folder;

registerDependencies(CompositionRootServer, serverProviders);
