import type { View } from "@/features/views/views";
import { type ClassValue, clsx } from "clsx";
import {
	addDays,
	addMonths,
	addWeeks,
	isSameDay,
	subDays,
	subMonths,
	subWeeks,
} from "date-fns";
import { twMerge } from "tailwind-merge";
import type { SensorDataResponseDto } from "./dto";

export function cn(...inputs: Array<ClassValue>) {
	return twMerge(clsx(inputs));
}

export const getPrevDay = (selectedDay: Date, view: View): Date => {
	let prevDay: Date;
	if (view === "day") {
		prevDay = subDays(selectedDay, 1);
	} else if (view === "week") {
		prevDay = subWeeks(selectedDay, 1);
	} else {
		prevDay = subMonths(selectedDay, 1);
	}
	const utcPrevDay = new Date(
		Date.UTC(
			prevDay.getUTCFullYear(),
			prevDay.getUTCMonth(),
			prevDay.getUTCDate(),
		),
	);
	return utcPrevDay;
};

export const getNextDay = (selectedDay: Date, view: View): Date => {
	let nextDay: Date;
	if (view === "day") {
		nextDay = addDays(selectedDay, 1);
	} else if (view === "week") {
		nextDay = addWeeks(selectedDay, 1);
	} else {
		nextDay = addMonths(selectedDay, 1);
	}

	const utcNextDay = new Date(
		Date.UTC(
			nextDay.getUTCFullYear(),
			nextDay.getUTCMonth(),
			nextDay.getUTCDate(),
		),
	);
	return utcNextDay;
};

export const makeCumulative = (
	data: Array<SensorDataResponseDto> | undefined,
) => {
	if (!data || data.length === 0) {
		return [];
	}
	let sum = 0;
	let currentDate = data[0].time;
	return data.map((point) => {
		if (!isSameDay(point.time, currentDate)) {
			sum = 0;
			currentDate = point.time;
		}
		sum += point.value;
		return { time: point.time, value: sum, dangerLevel: point.dangerLevel };
	});
};

export function computeYAxisRange(
	data: Array<SensorDataResponseDto>,
	options?: {
		topPadding?: number;
		bottomPadding?: number;
		//Rounds the Y-axix labels to make them more readable. For example, with a step of 10, a max value of 83 would be rounded up to 90.
		step?: number;
		clampToZero?: boolean;
	},
) {
	const {
		topPadding = 5,
		bottomPadding = 10,
		step = 10,
		clampToZero = true,
	} = options ?? {};

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
