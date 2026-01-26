import { useDate } from "@/features/date-picker/use-date";
import type { Day, Locale } from "date-fns";
import {
	addDays,
	eachDayOfInterval,
	eachMinuteOfInterval,
	format,
	isSameMonth,
	isSameYear,
	isToday,
	set,
	startOfDay,
	startOfWeek,
} from "date-fns";

export function useWeekView({
	minuteStep = 30,
	weekStartsOn = 1,
	dayStartHour,
	dayEndHour,
	locale,
	disabledCell,
	disabledDay,
	disabledWeek,
}:
	| {
			minuteStep?: number;
			dayStartHour?: number;
			dayEndHour?: number;
			weekStartsOn?: Day;
			locale?: Locale;
			disabledCell?: (date: Date) => boolean;
			disabledDay?: (date: Date) => boolean;
			disabledWeek?: (startDayOfWeek: Date) => boolean;
	  }
	| undefined = {}) {
	const { date: selectedDay, setDate: setSelectedDay } = useDate();

	const nextWeek = () => {
		const _nextWeek = addDays(selectedDay, 7);
		if (disabledWeek?.(_nextWeek)) return;
		setSelectedDay(_nextWeek);
	};

	const previousWeek = () => {
		const _previousWeek = addDays(selectedDay, -7);
		if (disabledWeek?.(_previousWeek)) return;
		setSelectedDay(_previousWeek);
	};

	const goToToday = () => {
		setSelectedDay(startOfWeek(startOfDay(new Date()), { weekStartsOn }));
	};

	const days = eachDayOfInterval({
		start: startOfWeek(selectedDay, { weekStartsOn: 1 }),
		end: addDays(startOfWeek(selectedDay, { weekStartsOn: 1 }), 6),
	}).map((day) => ({
		date: day,
		isToday: isToday(day),
		name: format(day, "EEEE", { locale }),
		shortName: format(day, "EEE", { locale }),
		dayOfMonth: format(day, "d", { locale }),
		dayOfMonthWithZero: format(day, "dd", { locale }),
		dayOfMonthWithSuffix: format(day, "do", { locale }),
		disabled: disabledDay ? disabledDay(day) : false,
		cells: eachMinuteOfInterval(
			{
				start: set(day, {
					hours: dayStartHour,
					minutes: 0,
					seconds: 0,
					milliseconds: 0,
				}),
				end: set(day, {
					hours: dayEndHour,
					minutes: 0,
					seconds: 0,
					milliseconds: 0,
				}),
			},
			{
				step: minuteStep,
			},
		).map((hour) => ({
			date: hour,
			hour: format(hour, "HH", { locale }),
			minute: format(hour, "mm", { locale }),
			hourAndMinute: format(hour, "HH:mm", { locale }),
			disabled: disabledCell ? disabledCell(hour) : false,
		})),
	}));

	const isAllSameYear = isSameYear(days[0].date, days[days.length - 1].date);
	const isAllSameMonth = isSameMonth(days[0].date, days[days.length - 1].date);

	let viewTitle = "";
	if (isAllSameMonth) viewTitle = format(days[0].date, "MMMM yyyy", { locale });
	else if (isAllSameYear)
		viewTitle = `${format(days[0].date, "MMM", { locale })} - ${format(
			days[days.length - 1].date,
			"MMM",
			{ locale },
		)} ${format(days[0].date, "yyyy", { locale })}`;
	else
		viewTitle = `${format(days[0].date, "MMM yyyy", { locale })} - ${format(
			days[days.length - 1].date,
			"MMM yyyy",
			{ locale },
		)}`;

	const weekNumber = format(days[0].date, "w", { locale });

	return {
		nextWeek,
		previousWeek,
		goToToday,
		days,
		weekNumber,
		viewTitle,
		dayStartHour,
		dayEndHour,
	};
}
