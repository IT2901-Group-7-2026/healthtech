import { parseAsStringLiteral } from "nuqs";
import { z } from "zod";

export type Sensor = (typeof sensors)[number];
export const sensors = ["dust", "noise", "vibration"] as const;
export const SensorSchema = z.enum(sensors);
export const parseAsSensor = parseAsStringLiteral(sensors);
