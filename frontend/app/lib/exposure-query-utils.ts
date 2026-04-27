import type { Exposure } from "@/features/exposure-picker/exposures";
import type { View } from "@/features/views/views";
import type { TZDate } from "@date-fns/tz";
import { endOfDay, endOfMonth, endOfWeek, startOfDay, startOfMonth, startOfWeek } from "date-fns";
import type {
	AggregateFnKey,
	ExposureDataRequestDto,
	ExposureOverviewRequestDto,
	ExposureTypeField,
	GranularityKey,
} from "./dto";

function getGranularityFromView(view: View, isOverview?: boolean): GranularityKey {
	switch (view) {
		case "day":
			// The overview shows hourly data in the day view
			return isOverview ? "hour" : "minute";
		case "week":
			return "hour";
		case "month":
			return "day";
	}
}

function getAggregationFunction(exposure: Exposure, usePeakAggregation: boolean): AggregateFnKey {
	switch (exposure) {
		case "dust":
			return "avg";
		case "noise":
			return usePeakAggregation ? "max" : "avg";
		case "vibration":
			return "sum";
	}
}

function getExposureTypeFieldFromExposure(exposure: Exposure): ExposureTypeField | undefined {
	switch (exposure) {
		case "dust":
			return "pm1_twa";
		case "noise":
		case "vibration":
			return undefined;
	}
}

export function getStartEnd(
	view: View,
	selectedDay: TZDate,
): {
	startTime: TZDate;
	endTime: TZDate;
} {
	switch (view) {
		case "day":
			return {
				startTime: startOfDay(selectedDay),
				endTime: endOfDay(selectedDay),
			};
		case "week":
			return {
				startTime: startOfWeek(selectedDay, { weekStartsOn: 1 }),
				endTime: endOfWeek(selectedDay, { weekStartsOn: 1 }),
			};
		case "month":
			return {
				startTime: startOfMonth(selectedDay),
				endTime: endOfMonth(selectedDay),
			};
	}
}

export function buildExposureQuery(
	exposure: Exposure,
	view: View,
	selectedDay: TZDate,
	options?: {
		granularity?: GranularityKey;
		aggregationFunction?: AggregateFnKey;
		field?: ExposureTypeField;
		usePeakAggregation?: boolean;
		isOverview?: boolean;
		startTime?: TZDate;
		endTime?: TZDate;
	},
): ExposureDataRequestDto {
	const { startTime: defaultStartTime, endTime: defaultEndTime } = getStartEnd(view, selectedDay);

	const startTime = options?.startTime ?? defaultStartTime;
	const endTime = options?.endTime ?? defaultEndTime;

	const granularity = options?.granularity ?? getGranularityFromView(view, options?.isOverview);
	const aggregationFunction =
		options?.aggregationFunction ?? getAggregationFunction(exposure, options?.usePeakAggregation ?? false);
	const field = options?.field ?? getExposureTypeFieldFromExposure(exposure);

	const query: ExposureDataRequestDto = {
		startTime,
		endTime,
		granularity,
		function: aggregationFunction,
		field,
	};

	return query;
}

export function buildExposureOverviewQuery(
	exposures: Array<Exposure>,
	view: View,
	selectedDate: TZDate,
	options?: {
		usePeakAggregation?: boolean;
		granularity?: GranularityKey;
	},
): ExposureOverviewRequestDto {
	return Object.fromEntries(
		exposures.map((exposure) => [
			exposure,
			buildExposureQuery(exposure, view, selectedDate, {
				isOverview: true,
				usePeakAggregation: options?.usePeakAggregation,
				granularity: options?.granularity,
			}),
		]),
	);
}
