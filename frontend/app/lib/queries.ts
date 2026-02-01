import type { Sensor } from "@/features/sensor-picker/sensors";
import type { View } from "@/features/views/views";
import { endOfMonth, endOfWeek, startOfMonth, startOfWeek } from "date-fns";
import type {
	AggregateFnKey,
	GranularityKey,
	SensorDataRequestDto,
} from "./dto";

const viewToGranularity: Record<View, GranularityKey> = {
	day: "minute",
	week: "hour",
	month: "day",
};

const sensorViewToAggregateFn: Record<Sensor, Record<View, AggregateFnKey>> = {
	dust: {
		day: "max",
		week: "max",
		month: "max",
	},
	noise: {
		day: "max",
		week: "max",
		month: "max",
	},
	vibration: {
		day: "max",
		week: "max",
		month: "max",
	},
};

const sensorToField: Record<Sensor, string | undefined> = {
	dust: "pm1_stel",
	noise: undefined,
	vibration: undefined,
};

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
				startTime: new Date(selectedDay.setUTCHours(8)),
				endTime: new Date(selectedDay.setUTCHours(16)),
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
		default: {
			// Exhaustive switch statement, should never reach here
			console.error("Invalid view type");
			const unreachable: never = view;
			return unreachable;
		}
	}
}

export function buildSensorQuery(
	sensor: Sensor,
	view: View,
	selectedDay: Date,
	granularityOverride?: GranularityKey,
): SensorDataRequestDto {
	const { startTime, endTime } = getStartEnd(view, selectedDay);
	const granularity = granularityOverride ?? viewToGranularity[view];
	const func = sensorViewToAggregateFn[sensor][view];
	const field = sensorToField[sensor];

	const query: SensorDataRequestDto = {
		startTime,
		endTime,
		granularity,
		function: func,
		field: field,
	};

	return query;
}
