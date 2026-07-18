export const GhoulClans = [`Kaneki`] as const;
export const CCGClans = [`Arima`] as const;

export type GhoulClans = (typeof GhoulClans)[number];
export type CCGClans = (typeof CCGClans)[number];
