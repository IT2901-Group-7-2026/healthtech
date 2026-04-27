import { hoursToMinutes } from "date-fns";
import type { DangerLevel } from "./danger-levels";
import type { ExposureDto, ExposureOverviewBucketDto, GranularityKey } from "./dto";
import { type Exposure, exposures } from "./exposures";
import type { OverviewChartRow, SummaryCounts, SummaryLevelCounts, TimeBucketStatus } from "./time-bucket-types";

interface CalculateSummaryCountsOptions {
	peakAggregation: boolean;
	granularity: GranularityKey;
	exposure: Exposure | null;
}

export function calculateSummaryCounts(
	data: Array<ExposureDto> | Array<ExposureOverviewBucketDto>,
	{ exposure, peakAggregation, granularity }: CalculateSummaryCountsOptions,
): SummaryCounts {
	const summary: SummaryCounts = {
		...createEmptyLevelCounts(),
		byExposure: {
			noise: createEmptyLevelCounts(),
			dust: createEmptyLevelCounts(),
			vibration: createEmptyLevelCounts(),
		},
	};

	for (const point of data) {
		const dangerLevel =
			"peakDangerLevel" in point ? getDangerLevelFromData(point, peakAggregation) : point.dangerLevel;

		incrementLevelCount(summary, dangerLevel, granularity);

		if ("exposureDangerLevels" in point) {
			for (const currentExposure of exposures) {
				incrementLevelCount(
					summary.byExposure[currentExposure],
					point.exposureDangerLevels[currentExposure],
					granularity,
				);
			}
		} else if (exposure) {
			incrementLevelCount(summary.byExposure[exposure], dangerLevel, granularity);
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

export function getDangerLevelFromData(data: ExposureDto, peakAggregation: boolean): DangerLevel {
	if (peakAggregation) {
		return data.peakDangerLevel ?? data.dangerLevel;
	}
	return data.dangerLevel;
}

export function mapExposureDataToTimeBucketStatuses(
	data: Array<ExposureDto>,
	exposure: Exposure,
	peakAggregation: boolean,
): Array<TimeBucketStatus> {
	return data.map((point) => {
		const dangerLevel = getDangerLevelFromData(point, peakAggregation);

		return {
			time: point.time,
			dangerLevel,
			exposureDangerLevels: { [exposure]: dangerLevel },
		};
	});
}

export function mapOverviewDataToTimeBucketStatuses(data: Array<ExposureOverviewBucketDto>): Array<TimeBucketStatus> {
	return data.map((point) => ({
		time: point.time,
		dangerLevel: point.dangerLevel,
		exposureDangerLevels: point.exposureDangerLevels,
	}));
}

export function mapOverviewBucketsToChartRows(
	data: Array<ExposureOverviewBucketDto>,
	startHour: number,
	endHour: number,
): Array<OverviewChartRow> {
	return exposures.map((exposure) => {
		const dangerLevelByHour: Record<number, DangerLevel | null> = {};

		for (let hour = startHour; hour <= endHour; hour++) {
			dangerLevelByHour[hour] = null;
		}

		data.forEach((bucket) => {
			const hour = bucket.time.getUTCHours();
			if (hour < startHour || hour > endHour) return;

			dangerLevelByHour[hour] = bucket.exposureDangerLevels[exposure] ?? null;
		});

		return {
			exposure,
			dangerLevelByHour,
		};
	});
}
