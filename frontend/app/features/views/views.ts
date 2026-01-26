export const views = ["day", "week", "month"] as const;
export type View = (typeof views)[number];
