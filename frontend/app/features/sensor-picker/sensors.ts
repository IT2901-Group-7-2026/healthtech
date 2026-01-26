import { parseAsStringLiteral } from "nuqs";

export type Sensor = (typeof sensors)[number];
export const sensors = ["dust", "noise", "vibration"] as const;
export const parseAsSensor = parseAsStringLiteral(sensors);
