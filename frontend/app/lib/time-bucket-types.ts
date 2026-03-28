import type { DangerLevel } from "./danger-levels";
import type { Sensor } from "./sensors";

export type OverviewChartRow = {
	sensor: Sensor;
	dangerLevelByHour: Record<number, DangerLevel | null>;
};

export type TimeBucketStatus = {
	time: Date;
	dangerLevel: DangerLevel;
	sensorDangerLevels?: Partial<Record<Sensor, DangerLevel>>;
};

export type SummaryLevelCounts = {
	safeCount: number;
	warningCount: number;
	dangerCount: number;
};

export type SummaryCounts = SummaryLevelCounts & {
	bySensor: Record<Sensor, SummaryLevelCounts>;
};
