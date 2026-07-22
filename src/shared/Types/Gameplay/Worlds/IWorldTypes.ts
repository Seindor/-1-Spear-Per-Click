export const WallPreset: IWall = {
    [`Material`]: Enum.Material.SmoothPlastic,
    [`Start_Color`]: Color3.fromRGB(255, 255, 255),
    [`End_Color`]: Color3.fromRGB(255, 255, 255),

    [`ColorMapContent`]: `rbxassetid://6372755229`,

    [`OffsetStudsU`]: 0,
    [`OffsetStudsV`]: 0,

    [`StudsPerTileU`]: 8,
    [`StudsPerTileV`]: 8,
};

export interface IWall {
    [`Material`]?: Enum.Material;
    [`Start_Color`]?: Color3;
    [`End_Color`]?: Color3;

    [`ColorMapContent`]?: string;

    [`OffsetStudsU`]?: number;
    [`OffsetStudsV`]?: number;

    [`StudsPerTileU`]?: number;
    [`StudsPerTileV`]?: number;
}

export interface IWolrd {
    [`Rewards`]: Record<number, Record<string, number>>;
    [`Start_Health`]: number;
    [`Health_Scaling`]: Record<number, number>;
    [`Walls`]: Record<number, IWall>;
}
