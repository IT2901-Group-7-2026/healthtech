import { type DangerLevel } from "./danger-levels.ts";
import { type Sensor } from "./sensors.ts";

export type OverviewChartRow = {
	sensor: Sensor;
	dangerLevelByHour: Record<number, DangerLevel | null>;
};

export type TimeBucketStatus = {
	time: Date;
	dangerLevel: DangerLevel;
	sensorDangerLevels?: Partial<Record<Sensor, DangerLevel>>;
};

export type SummaryCounts = {
	safeCount: number;
	warningCount: number;
	dangerCount: number;
};
