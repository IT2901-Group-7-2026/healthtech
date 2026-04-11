import type { DangerLevel } from "./danger-levels";
import type { OverviewBucketDto, SensorDataResponseDto } from "./dto";
import { type Sensor, sensors } from "./sensors";
import type { OverviewChartRow, SummaryCounts, SummaryLevelCounts, TimeBucketStatus } from "./time-bucket-types";


export function calculateSummaryCounts(
	data: Array<SensorDataResponseDto> | Array<OverviewBucketDto>,
	sensor?: Sensor,
	usePeakDangerLevel?: boolean,
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
			"peakDangerLevel" in point ? getDangerLevelFromData(point, usePeakDangerLevel) : point.dangerLevel;

		incrementLevelCount(summary, dangerLevel);

		if ("sensorDangerLevels" in point) {
			for (const currentSensor of sensors) {
				incrementLevelCount(summary.bySensor[currentSensor], point.sensorDangerLevels[currentSensor]);
			}
		} else if (sensor) {
			incrementLevelCount(summary.bySensor[sensor], dangerLevel);
		}
	}

	return summary;
}

function createEmptyLevelCounts(): SummaryLevelCounts {
	return {
		safeCount: 0,
		warningCount: 0,
		dangerCount: 0,
	};
}

function incrementLevelCount(counts: SummaryLevelCounts, level: DangerLevel | null | undefined) {
	switch (level) {
		case "safe":
			counts.safeCount += 1;
			break;
		case "warning":
			counts.warningCount += 1;
			break;
		case "danger":
			counts.dangerCount += 1;
			break;
		default:
			break;
	}
}

export function getDangerLevelFromData(data: SensorDataResponseDto, usePeakDangerLevel?: boolean): DangerLevel {
	if (usePeakDangerLevel) {
		return data.peakDangerLevel ?? data.dangerLevel;
	}
	return data.dangerLevel;
}

export function mapSensorDataToTimeBucketStatuses(
	data: Array<SensorDataResponseDto>,
	sensor: Sensor,
	usePeakDangerLevel?: boolean,
): Array<TimeBucketStatus> {
	return data.map((point) => {
		const dangerLevel = getDangerLevelFromData(point, usePeakDangerLevel);

		return {
			time: point.time,
			dangerLevel,
			sensorDangerLevels: { [sensor]: dangerLevel },
		};
	});
}

export function mapOverviewDataToTimeBucketStatuses(data: Array<OverviewBucketDto>): Array<TimeBucketStatus> {
	return data.map((point) => ({
		time: point.time,
		dangerLevel: point.dangerLevel,
		sensorDangerLevels: point.sensorDangerLevels,
	}));
}

export function mapOverviewBucketsToChartRows(
	data: Array<OverviewBucketDto>,
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
