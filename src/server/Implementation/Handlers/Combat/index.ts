import { DefaultCombat } from "./Default";

const Combats = {
    Default: DefaultCombat,
};

export const SetupCombat = (ownerId: string, combatName: string) => {
    let combat = Combats[combatName as keyof typeof Combats];
    combat(ownerId);
};
