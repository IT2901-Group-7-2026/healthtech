import { useDate } from "@/features/date-picker/use-date";
import { getFormatOptions, useFormatDate } from "@/hooks/use-format-date.js";
import { tz } from "@date-fns/tz";
import type { Day, Locale } from "date-fns";
import {
	addDays,
	addWeeks,
	eachDayOfInterval,
	eachMinuteOfInterval,
	format,
	getWeek,
	isSameMonth,
	isSameYear,
	isToday,
	set,
	startOfDay,
	startOfWeek,
} from "date-fns";

const getViewTitle = (firstDay: Date, lastDay: Date, locale?: Locale) => {
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
	minuteStep?: number;
	dayStartHour?: number;
	dayEndHour?: number;
	weekStartsOn?: Day;
	locale?: Locale;
	isDisabledCell?: (date: Date) => boolean;
	isDisabledDay?: (date: Date) => boolean;
	isDisabledWeek?: (startDayOfWeek: Date) => boolean;
}

export function useWeekView({
	minuteStep = 30,
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
		const today = startOfDay(new Date());
		const startOfCurrentWeek = startOfWeek(today, { weekStartsOn });

		setSelectedDay(startOfCurrentWeek);
	};

	const daysInWeek = eachDayOfInterval({
		start: startOfWeek(selectedDay),
		end: addDays(startOfWeek(selectedDay), 6),
	});

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

		const dateSteps = eachMinuteOfInterval(
			{ start, end },
			{ step: minuteStep },
		);

		const cells = dateSteps.map((date) => ({
			date: date,
			hour: formatDate(date, "HH"),
			minute: formatDate(date, "mm"),
			hourAndMinute: formatDate(date, "HH:mm"),
			disabled: isDisabledCell ? isDisabledCell(date) : false,
		}));

		return {
			date: day,
			isToday: isToday(day),
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
	const weekNumber = getWeek(firstDay, { in: tz("Europe/Oslo") });

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
