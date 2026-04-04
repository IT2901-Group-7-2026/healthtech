import type { useFormatDate } from "@/hooks/use-format-date.js";
import { TIMEZONE } from "@/i18n/locale";
import { toTZDate } from "@/lib/date";
import type { TZDate } from "@date-fns/tz";
import {
	addDays,
	eachDayOfInterval,
	eachHourOfInterval,
	isToday,
	set,
	startOfWeek,
} from "date-fns";

interface WeekViewOptions {
	selectedDate: TZDate;
	formatDate: ReturnType<typeof useFormatDate>;
	dayStartHour: number;
	dayEndHour: number;
	isCellDisabled?: (date: TZDate) => boolean;
	isDayDisabled?: (date: TZDate) => boolean;
}

export const getTimeslotSegments = ({
	selectedDate,
	formatDate,
	dayStartHour,
	dayEndHour,
	isCellDisabled,
	isDayDisabled,
}: WeekViewOptions) => {
	const daysInWeek = eachDayOfInterval({
		start: startOfWeek(selectedDate),
		end: addDays(startOfWeek(selectedDate), 6),
	}).map(toTZDate);

	return daysInWeek.map((day) => {
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
			disabled: isCellDisabled?.(date) ?? false,
		}));

		return {
			date: day,
			isToday: isToday(day, { in: TIMEZONE }),
			name: formatDate(day, "EEEE"),
			shortName: formatDate(day, "EEE"),
			dayOfMonth: formatDate(day, "d"),
			dayOfMonthWithZero: formatDate(day, "dd"),
			dayOfMonthWithSuffix: formatDate(day, "do"),
			disabled: isDayDisabled?.(day) ?? false,
			cells,
		};
	});
};
