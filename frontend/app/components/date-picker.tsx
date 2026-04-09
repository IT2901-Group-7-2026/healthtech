import { useFormatDate } from "@/hooks/use-format-date";
import { TIMEZONE, TIMEZONE_NAME } from "@/i18n/locale";
import { cn } from "@/lib/utils";
import { Calendar } from "@/ui/calendar";
import { TZDate } from "@date-fns/tz";
import { addMonths, addWeeks, startOfMonth, startOfWeek, subMilliseconds } from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DayPickerProps } from "react-day-picker";
import { useTranslation } from "react-i18next";

type DatePickerProps = Omit<
	DayPickerProps,
	"mode" | "required" | "defaultMonth" | "onSelect" | "selected" | "timeZone" | "weekStartsOn"
> & {
	onDateChange: (date: TZDate) => void;
	date: TZDate;
	mode?: "day" | "week" | "month";
	withFooter?: boolean;
};

export function DatePicker({
	mode = "day",
	date,
	onDateChange,
	locale,
	className,
	withFooter = true,
	...props
}: DatePickerProps) {
	const formatDate = useFormatDate();
	const { t, i18n } = useTranslation();

	const [selectedDate, setSelectedDate] = useState<TZDate>(date);

	useEffect(() => {
		if (!date) {
			return;
		}

		setSelectedDate((prev) => (prev.getTime() === date.getTime() ? prev : date));
	}, [date]);

	const rangeStart = useMemo(() => {
		if (mode === "day") {
			return undefined;
		}

		if (mode === "week") {
			return startOfWeek(selectedDate, { weekStartsOn: 1, in: TIMEZONE });
		}

		return startOfMonth(selectedDate, { in: TIMEZONE });
	}, [mode, selectedDate]);

	const rangeEnd = useMemo(() => {
		if (mode === "day" || !rangeStart) {
			return undefined;
		}

		const addFn = mode === "week" ? addWeeks : addMonths;

		return subMilliseconds(addFn(rangeStart, 1, { in: TIMEZONE }), 1);
	}, [mode, rangeStart]);

	const handleDayClick = useCallback(
		(clickedDate: Date) => {
			const tzDate = new TZDate(clickedDate, TIMEZONE_NAME);

			setSelectedDate(tzDate);
			onDateChange(tzDate);
		},
		[onDateChange],
	);

	const calendarProps = {
		locale: locale || { code: i18n.language },
		defaultMonth: selectedDate,
		timeZone: TIMEZONE_NAME,
		weekStartsOn: 1,
		...props,
	} as const satisfies Partial<DayPickerProps>;

	const modifiers =
		mode === "day"
			? undefined
			: {
					highlighted: { from: rangeStart, to: rangeEnd },
					rangeStart: rangeStart ?? false,
					rangeEnd: rangeEnd ?? false,
				};

	const modifiersClassNames =
		mode === "day"
			? undefined
			: {
					highlighted: "bg-accent text-accent-foreground",
					rangeStart: "rounded-l-xl",
					rangeEnd: "rounded-r-xl",
				};

	const selectionDetail = formatSelection(
		rangeStart && rangeEnd ? [rangeStart, rangeEnd] : selectedDate,
		i18n.language,
		formatDate,
	);

	const selectionRecap = selectionDetail.date
		? t(($) => $.dateSelectionRecapSingle, { date: selectionDetail.date })
		: t(($) => $.dateSelectionRecapMultiple, {
				startDate: selectionDetail.startDate,
				endDate: selectionDetail.endDate,
			});

	return (
		<Calendar
			mode="single"
			className={cn("w-65 bg-transparent p-0", className)}
			required={true}
			month={selectedDate}
			selected={selectedDate}
			onSelect={handleDayClick}
			modifiers={modifiers}
			captionLayout="dropdown"
			modifiersClassNames={{
				today: "[&>button]:font-bold",
				...modifiersClassNames,
			}}
			footer={
				withFooter ? (
					<p className="mt-2 text-wrap text-muted-foreground text-xs">{selectionRecap}</p>
				) : undefined
			}
			{...calendarProps}
		/>
	);
}

function formatSelection(
	dates: TZDate | [TZDate, TZDate],
	locale: string,
	formatDate: ReturnType<typeof useFormatDate>,
) {
	const isEn = locale === "en";

	if (!Array.isArray(dates)) {
		return {
			date: formatDate(dates, isEn ? "MMM d, yyyy" : "d. MMM yyyy"),
		};
	}

	const [start, end] = dates;

	const startStr = formatDate(start, isEn ? "MMM d" : "d. MMM");
	const endStr = formatDate(end, isEn ? "MMM d, yyyy" : "d. MMM yyyy");

	return { startDate: startStr, endDate: endStr };
}
