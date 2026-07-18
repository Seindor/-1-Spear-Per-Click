import { Container } from "shared/DI/Container";
import { registerDependencies } from "shared/DI/RegisterDependencies";
import { ReplicatedStorage } from "@rbxts/services";

export const CompositionRootShared = new Container();

const serverProviders = ReplicatedStorage.WaitForChild("TS")
    .WaitForChild("DI")
    .WaitForChild("Providers")
    .WaitForChild("Shared") as Folder;

registerDependencies(CompositionRootShared, serverProviders);
