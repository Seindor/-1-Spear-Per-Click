import { ClientMovementAnimationHandler } from "./ClientMovementAnimationHandler";
import type { MovementAnimationTarget } from "shared/Types/Gameplay/Animations/MovementAnimationTypes";

class ClientMovementAnimationHandlerRegistryClass {
    private readonly owners = new Map<string, Map<string, ClientMovementAnimationHandler>>();

    public Attach(
        ownerId: string,
        modelKey: string,
        target: MovementAnimationTarget,
    ): ClientMovementAnimationHandler {
        let ownerMap = this.owners.get(ownerId);
        if (!ownerMap) {
            ownerMap = new Map();
            this.owners.set(ownerId, ownerMap);
        }

        ownerMap.get(modelKey)?.Destroy();

        const handler = new ClientMovementAnimationHandler(ownerId, modelKey, target);
        ownerMap.set(modelKey, handler);

        return handler;
    }

    public Get(ownerId: string, modelKey: string): ClientMovementAnimationHandler | undefined {
        return this.owners.get(ownerId)?.get(modelKey);
    }

    public Has(ownerId: string, modelKey: string): boolean {
        return this.owners.get(ownerId)?.has(modelKey) ?? false;
    }

    public Detach(ownerId: string, modelKey: string): void {
        const ownerMap = this.owners.get(ownerId);
        if (!ownerMap) return;

        ownerMap.get(modelKey)?.Destroy();
        ownerMap.delete(modelKey);

        if (ownerMap.size() === 0) {
            this.owners.delete(ownerId);
        }
    }

    public DetachAll(ownerId: string): void {
        const ownerMap = this.owners.get(ownerId);
        if (!ownerMap) return;

        for (const [, handler] of ownerMap) {
            handler.Destroy();
        }

        this.owners.delete(ownerId);
    }

    public GetAll(
        ownerId: string,
    ): ReadonlyMap<string, ClientMovementAnimationHandler> | undefined {
        return this.owners.get(ownerId);
    }
}

export const ClientMovementAnimationHandlerRegistry =
    new ClientMovementAnimationHandlerRegistryClass();
