import type { View } from "@/features/views/views";
import type { TranslateFn } from "@/i18n/config.js";
import { TIMEZONE_NAME } from "@/i18n/locale";
import { TZDate } from "@date-fns/tz";
import { type ClassValue, clsx } from "clsx";
import { addDays, addMonths, addWeeks, subDays, subMonths, subWeeks } from "date-fns";
import { CircleDashedIcon, FrownIcon, MehIcon, SmileIcon } from "lucide-react";
import { twMerge } from "tailwind-merge";
import type { DangerLevel } from "./danger-levels";
import { now } from "./date";
import { DEFAULT_MAX_HOUR_DOMAIN, DEFAULT_MIN_HOUR_DOMAIN, type HourDomainDto, type SensorDto, type User } from "./dto";
import type { Sensor, SensorUnit } from "./sensors";

const MAX_CHART_HOUR = 23;
const MIN_CHART_HOUR = 0;
const UG_TO_MG = 0.001;

export function cn(...inputs: Array<ClassValue>) {
	return twMerge(clsx(inputs));
}

export const getPrevDay = (selectedDay: TZDate, view: View): TZDate => {
	let prevDay: TZDate;
	if (view === "day") {
		prevDay = subDays(selectedDay, 1);
	} else if (view === "week") {
		prevDay = subWeeks(selectedDay, 1);
	} else {
		prevDay = subMonths(selectedDay, 1);
	}

	return prevDay;
};

export const getNextDay = (selectedDay: TZDate, view: View): TZDate => {
	let nextDay: TZDate;
	if (view === "day") {
		nextDay = addDays(selectedDay, 1);
	} else if (view === "week") {
		nextDay = addWeeks(selectedDay, 1);
	} else {
		nextDay = addMonths(selectedDay, 1);
	}

	return nextDay;
};

export function computeYAxisRange(
	data: Array<SensorDto>,
	options?: {
		topPadding?: number;
		bottomPadding?: number;
		//Rounds the Y-axix labels to make them more readable. For example, with a step of 10, a max value of 83 would be rounded up to 90.
		step?: number;
		clampToZero?: boolean;
	},
) {
	const { topPadding = 5, bottomPadding = 10, step = 10, clampToZero = true } = options ?? {};

	if (!data || data.length === 0) {
		return { minY: 0, maxY: step };
	}

	const max = data.reduce((m, c) => (c.value > m ? c.value : m), data[0].value);
	const min = data.reduce((m, c) => (c.value < m ? c.value : m), data[0].value);

	const maxY = Math.ceil(max / step) * step + topPadding;
	const minY = Math.floor((min - bottomPadding) / step) * step;
	const clampedMinY = clampToZero ? Math.max(0, minY) : minY;

	return { minY: clampedMinY, maxY };
}

export const userRoleToString = (role: User["role"], t: TranslateFn) => {
	switch (role) {
		case "operator":
			return t(($) => $.user.role.operator);
		case "foreman":
			return t(($) => $.user.role.foreman);
		default:
			return role;
	}
};

export function downsampleDataPoints(data: Array<SensorDto>, bucketSize: number): Array<SensorDto> {
	const result: Array<SensorDto> = [];

	for (let i = 0; i < data.length; i += bucketSize) {
		const bucket = data.slice(i, i + bucketSize);
		if (!bucket.length) continue;

		let min = bucket[0];
		let max = bucket[0];

		//Keep min and max of each bucket
		for (const item of bucket) {
			if (item.value < min.value) min = item;
			if (item.value > max.value) max = item;
		}

		if (min.time < max.time) {
			result.push(min, max);
		} else {
			result.push(max, min);
		}
	}

	return result;
}

export function downsampleSensorData(sensor: Sensor, data: Array<SensorDto>): Array<SensorDto> {
	if (sensor === "vibration") {
		return data;
	}

	return downsampleDataPoints(data, 20);
}

export function shorthandName(name: string): string {
	if (!name) {
		return "";
	}

	const names = name.trim().split(/\s+/);

	if (names.length <= 1) {
		return name;
	}

	const firstInitial = names[0][0].toUpperCase();
	const lastname = names[names.length - 1];

	return `${firstInitial}. ${lastname}`;
}

export function capitalize(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getEmoji(dangerLevel: DangerLevel | null) {
	switch (dangerLevel) {
		case "danger":
			return FrownIcon;

		case "warning":
			return MehIcon;

		case "safe":
			return SmileIcon;

		case null:
			return CircleDashedIcon;
	}
}

export const clampHour = (hour: number) => Math.max(Math.min(hour, MAX_CHART_HOUR), MIN_CHART_HOUR);

export function getHourDomain(
	hourDomain: HourDomainDto | undefined,
	dates: Array<TZDate> | undefined,
	viewForPadding: View,
): {
	minHour: number;
	maxHour: number;
} {
	if (!(dates && hourDomain)) {
		const today = now();
		return {
			minHour: convertUtcHourToLocalHour(hourDomain?.minHourUtc ?? DEFAULT_MIN_HOUR_DOMAIN, today),
			maxHour: convertUtcHourToLocalHour(hourDomain?.maxHourUtc ?? DEFAULT_MAX_HOUR_DOMAIN, today),
		};
	}

	const minHours = dates.map((date) => convertUtcHourToLocalHour(hourDomain.minHourUtc, date));

	const maxHours = dates.map((date) => convertUtcHourToLocalHour(hourDomain.maxHourUtc, date));

	// maxHour in day views are non-inclusive, meaning if the last data point is 14:30,
	// maxHour needs to be at least 15 to include that data point in the chart. While week and month views are inclusive.
	// We add an additional hour of padding to ensure that the data doesn't look cut off
	const minHourPadding = 1;
	const maxHourPadding = viewForPadding === "day" ? 2 : 1;

	return {
		minHour: clampHour(Math.min(...minHours) - minHourPadding),
		maxHour: clampHour(Math.max(...maxHours) + maxHourPadding),
	};
}

function convertUtcHourToLocalHour(utcHour: number, date: TZDate): number {
	const localDate = new TZDate(date, TIMEZONE_NAME);
	localDate.setUTCHours(utcHour);
	return localDate.getHours();
}

export function formatSensorValue(
	value: number | undefined,
	unit: SensorUnit,
	options?: { digitsMg?: number; digitsDefault?: number },
) {
	if (value == null) {
		return "N/A";
	}

	const { digitsMg = 4, digitsDefault = 2 } = options ?? {};

	// convert if mg
	if (unit === "mg") {
		return (value * UG_TO_MG).toFixed(digitsMg);
	}

	return value.toFixed(digitsDefault);
}
