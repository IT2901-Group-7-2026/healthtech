import { type DangerLevel } from "./danger-levels.ts";
import { type OverviewBucketDto, type SensorDataResponseDto } from "./dto.ts";
import { type Sensor, sensors } from "./sensors.ts";
import {
	type OverviewChartRow,
	type SummaryCounts,
	type TimeBucketStatus,
} from "./time-bucket-types.ts";

export function calculateSummaryCounts(
	data: Array<SensorDataResponseDto> | Array<OverviewBucketDto>,
	usePeakDangerLevel?: boolean,
): SummaryCounts {
	const summary: SummaryCounts = {
		safeCount: 0,
		warningCount: 0,
		dangerCount: 0,
	};

	data.forEach((point) => {
		const dangerLevel =
			"peakDangerLevel" in point
				? getDangerLevelFromData(point, usePeakDangerLevel)
				: point.dangerLevel;

		switch (dangerLevel) {
			case "safe":
				summary.safeCount += 1;
				break;
			case "warning":
				summary.warningCount += 1;
				break;
			case "danger":
				summary.dangerCount += 1;
				break;
		}
	});

	return summary;
}

export function getDangerLevelFromData(
	data: SensorDataResponseDto,
	usePeakDangerLevel?: boolean,
): DangerLevel {
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

export function mapOverviewDataToTimeBucketStatuses(
	data: Array<OverviewBucketDto>,
): Array<TimeBucketStatus> {
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
			if (hour < startHour || hour > endHour) {
				return;
			}

			dangerLevelByHour[hour] = bucket.sensorDangerLevels[sensor] ?? null;
		});

		return {
			sensor,
			dangerLevelByHour,
		};
	});
}
