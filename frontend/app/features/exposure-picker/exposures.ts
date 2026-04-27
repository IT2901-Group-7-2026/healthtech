import { parseAsStringLiteral } from "nuqs";
import { z } from "zod";

export type Exposure = (typeof exposures)[number];
export const exposures = ["dust", "noise", "vibration"] as const;
export const ExposureSchema = z.enum(exposures);
export const parseAsExposure = parseAsStringLiteral(exposures);
