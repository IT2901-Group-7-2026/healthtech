import { hoursToMinutes } from "date-fns";
import type { DangerLevel } from "./danger-levels";
import type { GranularityKey, SensorDto, SensorOverviewBucketDto } from "./dto";
import { type Sensor, sensors } from "./sensors";
import type { OverviewChartRow, SummaryCounts, SummaryLevelCounts, TimeBucketStatus } from "./time-bucket-types";

interface CalculateSummaryCountsOptions {
	peakAggregation: boolean;
	granularity: GranularityKey;
	sensor: Sensor | null;
}

export function calculateSummaryCounts(
	data: Array<SensorDto> | Array<SensorOverviewBucketDto>,
	{ sensor, peakAggregation, granularity }: CalculateSummaryCountsOptions,
): SummaryCounts {
	const summary: SummaryCounts = {
		...createEmptyLevelCounts(),
		bySensor: {
			noise: createEmptyLevelCounts(),
			dust: createEmptyLevelCounts(),
			vibration: createEmptyLevelCounts(),
		},
	};

	for (const point of data) {
		const dangerLevel =
			"peakDangerLevel" in point ? getDangerLevelFromData(point, peakAggregation) : point.dangerLevel;

		incrementLevelCount(summary, dangerLevel, granularity);

		if ("sensorDangerLevels" in point) {
			for (const currentSensor of sensors) {
				incrementLevelCount(
					summary.bySensor[currentSensor],
					point.sensorDangerLevels[currentSensor],
					granularity,
				);
			}
		} else if (sensor) {
			incrementLevelCount(summary.bySensor[sensor], dangerLevel, granularity);
		}
	}

	return summary;
}

function createEmptyLevelCounts(): SummaryLevelCounts {
	return {
		safeMinutes: 0,
		warningMinutes: 0,
		dangerMinutes: 0,
	};
}

const HOURS_IN_DAY = 24;

function incrementLevelCount(
	counts: SummaryLevelCounts,
	level: DangerLevel | null | undefined,
	granularity: GranularityKey,
) {
	let value = 1;

	if (granularity === "hour") {
		value = hoursToMinutes(1);
	} else if (granularity === "day") {
		value = hoursToMinutes(1) * HOURS_IN_DAY;
	}

	switch (level) {
		case "safe":
			counts.safeMinutes += value;
			break;
		case "warning":
			counts.warningMinutes += value;
			break;
		case "danger":
			counts.dangerMinutes += value;
			break;
		default:
			break;
	}
}

export function getDangerLevelFromData(data: SensorDto, peakAggregation: boolean): DangerLevel {
	if (peakAggregation) {
		return data.peakDangerLevel ?? data.dangerLevel;
	}
	return data.dangerLevel;
}

export function mapSensorDataToTimeBucketStatuses(
	data: Array<SensorDto>,
	sensor: Sensor,
	peakAggregation: boolean,
): Array<TimeBucketStatus> {
	return data.map((point) => {
		const dangerLevel = getDangerLevelFromData(point, peakAggregation);

		return {
			time: point.time,
			dangerLevel,
			sensorDangerLevels: { [sensor]: dangerLevel },
		};
	});
}

export function mapOverviewDataToTimeBucketStatuses(data: Array<SensorOverviewBucketDto>): Array<TimeBucketStatus> {
	return data.map((point) => ({
		time: point.time,
		dangerLevel: point.dangerLevel,
		sensorDangerLevels: point.sensorDangerLevels,
	}));
}

export function mapOverviewBucketsToChartRows(
	data: Array<SensorOverviewBucketDto>,
	startHour: number,
	endHour: number,
): Array<OverviewChartRow> {
	return sensors.map((sensor) => {
		const dangerLevelByHour: Record<number, DangerLevel | null> = {};

		for (let hour = startHour; hour <= endHour; hour++) {
			dangerLevelByHour[hour] = null;
		}

		data.forEach((bucket) => {
			const hour = bucket.time.getUTCHours();
			if (hour < startHour || hour > endHour) return;

			dangerLevelByHour[hour] = bucket.sensorDangerLevels[sensor] ?? null;
		});

		return {
			sensor,
			dangerLevelByHour,
		};
	});
}
