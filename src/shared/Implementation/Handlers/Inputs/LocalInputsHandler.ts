import { Players } from "@rbxts/services";

import type { ContextAPI } from "shared/Domain/InputContext/API/ContextAPI";
import type EventBusAggregate from "shared/Domain/EventBus/Aggregates/EventBusAggregate";

import { InputsHandler } from "./InputsHandler";

import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";

const sharedScope = CompositionRootShared.createScope();

const contextsAPI = sharedScope.resolve(SharedRegistry.Singletons.API.ContextAPI) as ContextAPI;
const eventBusAPI = sharedScope.resolve(SharedRegistry.Singletons.API.EventBusAPI);

const localPlayerId = tostring(Players.LocalPlayer.UserId);
const inputsBus = eventBusAPI.New(localPlayerId, `Inputs`) as EventBusAggregate;

export const LocalInputsHandler = new InputsHandler(contextsAPI, inputsBus);
