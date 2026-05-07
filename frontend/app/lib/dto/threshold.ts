import type { Exposure } from "@/features/exposure-picker/exposures";
import { z } from "zod";

export const ExposureThresholdSummarySchema = z.object({
	safe: z.int().nonnegative(),
	warning: z.int().nonnegative(),
	danger: z.int().nonnegative(),
});

export const ThresholdSummarySchema = z.object({
	total: ExposureThresholdSummarySchema,
	dust: ExposureThresholdSummarySchema,
	vibration: ExposureThresholdSummarySchema,
	noise: ExposureThresholdSummarySchema,
} satisfies Record<Exposure | "total", unknown>);

export type ExposureThresholdSummary = z.infer<typeof ExposureThresholdSummarySchema>;
export type ThresholdSummary = z.infer<typeof ThresholdSummarySchema>;
