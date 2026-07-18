export const enum ItemType {
    Weapon,
    Armor,
    Consumable,
    Material,
    Quest,
    Skill,
}

export interface IItemStack {
    id: string;

    amount: number;

    data?: Record<string, unknown>;
}

export interface IItemDefinition {
    id: string;
    name: string;
    stacks: number;
    maxStacks: number;
    type: ItemType;
}
