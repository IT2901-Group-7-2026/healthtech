import type { View } from "@/features/views/views";
import type { TranslateFn } from "@/i18n/config.js";
import type { TZDate } from "@date-fns/tz";
import { type ClassValue, clsx } from "clsx";
import {
	addDays,
	addMonths,
	addWeeks,
	subDays,
	subMonths,
	subWeeks,
} from "date-fns";
import { twMerge } from "tailwind-merge";
import type { SensorDataResponseDto, User } from "./dto";
import type { Sensor } from "./sensors";
import type { DangerLevel } from "./danger-levels";
import { CircleDashedIcon, FrownIcon, MehIcon, SmileIcon } from "lucide-react";

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

export function downsampleDataPoints(
	data: Array<SensorDataResponseDto>,
	bucketSize: number,
): Array<SensorDataResponseDto> {
	const result: Array<SensorDataResponseDto> = [];

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

export function downsampleSensorData(
	sensor: Sensor,
	data: Array<SensorDataResponseDto>,
): Array<SensorDataResponseDto> {
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
	if (dangerLevel === "danger") {
		return FrownIcon;
	}

	if (dangerLevel === "warning") {
		return MehIcon;
	}

	if (dangerLevel === "safe") {
		return SmileIcon;
	}

	return CircleDashedIcon;
}
