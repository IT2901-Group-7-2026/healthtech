import { z } from "zod";

export const DEFAULT_MIN_HOUR_DOMAIN = 0;
export const DEFAULT_MAX_HOUR_DOMAIN = 23;

export const HourDomainDtoSchema = z.object({
	minHourUtc: z.int().min(0),
	maxHourUtc: z.int().max(23),
});

export type HourDomainDto = z.infer<typeof HourDomainDtoSchema>;
