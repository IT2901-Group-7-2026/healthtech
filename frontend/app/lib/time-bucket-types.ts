import type { TZDate } from "@date-fns/tz";
import type { DangerLevel } from "./danger-levels.ts";
import type { Exposure } from "./exposures.ts";

export type OverviewChartRow = {
	exposure: Exposure;
	dangerLevelByHour: Record<number, DangerLevel | null>;
};

export type TimeBucketStatus = {
	time: TZDate;
	dangerLevel: DangerLevel;
	exposureDangerLevels?: Partial<Record<Exposure, DangerLevel>>;
};

export type SummaryLevelCounts = {
	safeMinutes: number;
	warningMinutes: number;
	dangerMinutes: number;
};

export type SummaryCounts = SummaryLevelCounts & {
	byExposure: Record<Exposure, SummaryLevelCounts>;
};
