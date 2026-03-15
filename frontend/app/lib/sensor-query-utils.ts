import type { Sensor } from "@/features/sensor-picker/sensors";
import type { View } from "@/features/views/views";
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

// TODO: Create enum for field and give better name
function getFieldFromSensor(sensor: Sensor): string | undefined {
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
	selectedDay: Date,
): {
	startTime: Date;
	endTime: Date;
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
	selectedDay: Date,
	options?: {
		granularity?: GranularityKey;
		aggregationFunction?: AggregateFnKey;
		field?: string;
		usePeakAggregation?: boolean;
		isOverview?: boolean;
	},
): SensorDataRequestDto {
	const { startTime, endTime } = getStartEnd(view, selectedDay);

	const granularity =
		options?.granularity ??
		getGranularityFromView(view, options?.isOverview);
	const func =
		options?.aggregationFunction ??
		getAggregationFunction(sensor, options?.usePeakAggregation ?? false);
	const field = options?.field ?? getFieldFromSensor(sensor);

	const query: SensorDataRequestDto = {
		startTime,
		endTime,
		granularity,
		function: func,
		field,
	};

	return query;
}

export function buildSensorOverviewQuery(
	sensors: Array<Sensor>,
	view: View,
	selectedDate: Date,
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
