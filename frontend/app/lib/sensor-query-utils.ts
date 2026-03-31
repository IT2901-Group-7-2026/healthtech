import type { Sensor } from "@/features/sensor-picker/sensors";
import type { View } from "@/features/views/views";
import type { TZDate } from "@date-fns/tz";
import {
	endOfDay,
	endOfMonth,
	endOfWeek,
	startOfDay,
	startOfMonth,
	startOfWeek,
} from "date-fns";
import type {
	AggregateFnKey,
	GranularityKey,
	SensorDataRequestDto,
	SensorOverviewDataRequestDto,
	SensorTypeField,
} from "./dto";

function getGranularityFromView(
	view: View,
	isOverview?: boolean,
): GranularityKey {
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

function getAggregationFunction(
	sensor: Sensor,
	usePeakAggregation: boolean,
): AggregateFnKey {
	switch (sensor) {
		case "dust":
			return "avg";
		case "noise":
			return usePeakAggregation ? "max" : "avg";
		case "vibration":
			return "sum";
	}
}

function getSensorTypeFieldFromSensor(
	sensor: Sensor,
): SensorTypeField | undefined {
	switch (sensor) {
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

export function buildSensorQuery(
	sensor: Sensor,
	view: View,
	selectedDay: TZDate,
	options?: {
		granularity?: GranularityKey;
		aggregationFunction?: AggregateFnKey;
		field?: SensorTypeField;
		usePeakAggregation?: boolean;
		isOverview?: boolean;
	},
): SensorDataRequestDto {
	const { startTime, endTime } = getStartEnd(view, selectedDay);

	const granularity =
		options?.granularity ??
		getGranularityFromView(view, options?.isOverview);
	const aggregationFunction =
		options?.aggregationFunction ??
		getAggregationFunction(sensor, options?.usePeakAggregation ?? false);
	const field = options?.field ?? getSensorTypeFieldFromSensor(sensor);

	const query: SensorDataRequestDto = {
		startTime,
		endTime,
		granularity,
		function: aggregationFunction,
		field,
	};

	return query;
}

export function buildSensorOverviewQuery(
	sensors: Array<Sensor>,
	view: View,
	selectedDate: TZDate,
	options?: {
		usePeakAggregation?: boolean;
	},
): SensorOverviewDataRequestDto {
	return Object.fromEntries(
		sensors.map((sensor) => [
			sensor,
			buildSensorQuery(sensor, view, selectedDate, {
				isOverview: true,
				usePeakAggregation: options?.usePeakAggregation,
			}),
		]),
	);
}
