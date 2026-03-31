import { useDate } from "@/features/date-picker/use-date";
import { getFormatOptions, useFormatDate } from "@/hooks/use-format-date.js";
import { TIMEZONE } from "@/i18n/locale";
import { today, toTZDate } from "@/lib/date";
import type { TZDate } from "@date-fns/tz";
import {
	addDays,
	addWeeks,
	type Day,
	eachDayOfInterval,
	eachHourOfInterval,
	format,
	getWeek,
	isSameMonth,
	isSameYear,
	isToday,
	type Locale,
	set,
	startOfWeek,
} from "date-fns";

const getViewTitle = (firstDay: TZDate, lastDay: TZDate, locale?: Locale) => {
	const options = getFormatOptions(locale);

	if (isSameMonth(firstDay, lastDay)) {
		return format(firstDay, "MMMM yyyy", options);
	}

	if (isSameYear(firstDay, lastDay)) {
		const firstDayFormat = format(firstDay, "MMM", options);
		const lastDayFormat = format(lastDay, "MMM", options);
		const year = format(firstDay, "yyyy", options);

		return `${firstDayFormat} - ${lastDayFormat} ${year}`;
	}

	const firstDayFormat = format(firstDay, "MMM yyyy", options);
	const lastDayFormat = format(lastDay, "MMM yyyy", options);

	return `${firstDayFormat} - ${lastDayFormat}`;
};

interface WeekViewOptions {
	dayStartHour?: number;
	dayEndHour?: number;
	weekStartsOn?: Day;
	locale?: Locale;
	isDisabledCell?: (date: TZDate) => boolean;
	isDisabledDay?: (date: TZDate) => boolean;
	isDisabledWeek?: (startDayOfWeek: TZDate) => boolean;
}

export function useWeekView({
	weekStartsOn = 1,
	dayStartHour,
	dayEndHour,
	locale,
	isDisabledCell,
	isDisabledDay,
	isDisabledWeek,
}: WeekViewOptions = {}) {
	const { date: selectedDay, setDate: setSelectedDay } = useDate();
	const formatDate = useFormatDate();

	const selectNextWeek = () => {
		const nextWeek = addWeeks(selectedDay, 1);

		if (isDisabledWeek?.(nextWeek)) {
			return;
		}

		setSelectedDay(nextWeek);
	};

	const selectPreviousWeek = () => {
		const previousWeek = addWeeks(selectedDay, -1);

		if (isDisabledWeek?.(previousWeek)) {
			return;
		}

		setSelectedDay(previousWeek);
	};

	const selectCurrentWeek = () => {
		const startOfCurrentWeek = startOfWeek(today(), { weekStartsOn });

		setSelectedDay(startOfCurrentWeek);
	};

	const daysInWeek = eachDayOfInterval({
		start: startOfWeek(selectedDay, { weekStartsOn }),
		end: addDays(startOfWeek(selectedDay, { weekStartsOn }), 6),
	}).map(toTZDate);

	const timeSlotSegments = daysInWeek.map((day) => {
		const start = set(day, {
			hours: dayStartHour,
			minutes: 0,
			seconds: 0,
			milliseconds: 0,
		});

		const end = set(day, {
			hours: dayEndHour,
			minutes: 0,
			seconds: 0,
			milliseconds: 0,
		});

		// 1 time slot per hour
		const dateSteps = eachHourOfInterval({ start, end }).map(toTZDate);

		const cells = dateSteps.map((date) => ({
			date: date,
			hour: formatDate(date, "HH"),
			minute: formatDate(date, "mm"),
			hourAndMinute: formatDate(date, "HH:mm"),
			disabled: isDisabledCell ? isDisabledCell(date) : false,
		}));

		return {
			date: day,
			isToday: isToday(day, { in: TIMEZONE }),
			name: formatDate(day, "EEEE"),
			shortName: formatDate(day, "EEE"),
			dayOfMonth: formatDate(day, "d"),
			dayOfMonthWithZero: formatDate(day, "dd"),
			dayOfMonthWithSuffix: formatDate(day, "do"),
			disabled: isDisabledDay ? isDisabledDay(day) : false,
			cells,
		};
	});

	const firstDay = timeSlotSegments.at(0)?.date;
	const lastDay = timeSlotSegments.at(-1)?.date;

	if (!(firstDay && lastDay)) {
		throw new Error("Failed to calculate week view");
	}

	const viewTitle = getViewTitle(firstDay, lastDay, locale);
	const weekNumber = getWeek(firstDay, { in: TIMEZONE });

	return {
		selectNextWeek,
		selectPreviousWeek,
		selectCurrentWeek,
		timeSlotSegments,
		weekNumber,
		viewTitle,
		dayStartHour,
		dayEndHour,
	};
}
