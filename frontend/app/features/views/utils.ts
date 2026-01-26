import { parseAsStringLiteral } from "nuqs";

export const views = ["day", "week", "month"] as const;
export type View = (typeof views)[number];
export const parseAsView = parseAsStringLiteral(views);
