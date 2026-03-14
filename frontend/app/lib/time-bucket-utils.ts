import type { DangerLevel } from "./danger-levels";
import type { OverviewBucketDto, SensorDataResponseDto } from "./dto";
import { type Sensor, sensors } from "./sensors";
import type {
	OverviewChartRow,
	SummaryCounts,
	TimeBucketStatus,
} from "./time-bucket-types";

export function calculateSummaryCounts(
	data: Array<SensorDataResponseDto> | Array<OverviewBucketDto>,
	usePeakData?: boolean,
): SummaryCounts {
	const summary: SummaryCounts = {
		safeCount: 0,
		warningCount: 0,
		dangerCount: 0,
	};

	data.forEach((point) => {
		const dangerLevel =
			"dangerLevel" in point
				? point.dangerLevel
				: getDangerLevelFromData(point, usePeakData);

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
	usePeakData?: boolean,
): DangerLevel {
	if (usePeakData) {
		return data.peakDangerLevel ?? data.dangerLevel;
	}
	return data.dangerLevel;
}

export function mapSensorDataToTimeBucketStatuses(
	data: Array<SensorDataResponseDto>,
	sensor: Sensor,
	usePeakData?: boolean,
): Array<TimeBucketStatus> {
	return data.map((point) => {
		const dangerLevel = getDangerLevelFromData(point, usePeakData);

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

//TODO: Move usePeakData flag to backend

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
