export interface IWeaponData {
    [`Name`]: string;

    [`Stats`]: {
        [`Strength`]?: number;
    } & Record<string, number>;

    [`Cooldown`]: number;

    [`Tags`]: [`Weapon`?] & string[];
}
