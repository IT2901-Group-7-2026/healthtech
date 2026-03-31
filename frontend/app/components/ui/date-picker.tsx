import { TZDate } from "@date-fns/tz";
import {
	addMonths,
	addWeeks,
	startOfMonth,
	startOfWeek,
	subMilliseconds,
} from "date-fns";
import { CalendarIcon } from "lucide-react";
import * as React from "react";
import type { DayPickerProps } from "react-day-picker";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useFormatDate } from "@/hooks/use-format-date.js";
import { TIMEZONE, TIMEZONE_NAME } from "@/i18n/locale.js";
import { now } from "@/lib/date.js";
import { capitalize } from "@/lib/utils.js";

type DatePickerProps = Omit<
	DayPickerProps,
	| "mode"
	| "required"
	| "defaultMonth"
	| "onSelect"
	| "selected"
	| "timeZone"
	| "weekStartsOn"
> & {
	mode?: "day" | "week" | "month";
	date?: TZDate;
	onDateChange: (date: TZDate) => void;
};

export function DatePicker({
	mode = "day",
	date,
	onDateChange,
	locale,
	...props
}: DatePickerProps) {
	const formatDate = useFormatDate();
	const buttonId = React.useId();
	const { t, i18n } = useTranslation();

	const [selectedDate, setSelectedDate] = React.useState<TZDate>(date ?? now());

	const rangeStart = React.useMemo(() => {
		if (mode === "day") {
			return undefined;
		}

		if (mode === "week") {
			return startOfWeek(selectedDate, { weekStartsOn: 1, in: TIMEZONE });
		}

		return startOfMonth(selectedDate, { in: TIMEZONE });
	}, [mode, selectedDate]);

	const rangeEnd = React.useMemo(() => {
		if (mode === "day" || !rangeStart) {
			return undefined;
		}

		const addFn = mode === "week" ? addWeeks : addMonths;

		return subMilliseconds(addFn(rangeStart, 1, { in: TIMEZONE }), 1);
	}, [mode, rangeStart]);

	const handleDayClick = React.useCallback(
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
		mode !== "day"
			? {
					highlighted: { from: rangeStart, to: rangeEnd },
					rangeStart: rangeStart ?? false,
					rangeEnd: rangeEnd ?? false,
				}
			: undefined;

	const modifiersClassNames =
		mode !== "day"
			? {
					highlighted: "bg-accent text-accent-foreground",
					rangeStart: "rounded-l-xl",
					rangeEnd: "rounded-r-xl",
				}
			: undefined;

	let buttonLabel = t(($) => $.foremanDashboard.overview.selectDatePlaceholder);

	if (selectedDate) {
		if (mode === "day") {
			buttonLabel = formatDate(selectedDate, "PPP");
		} else if (mode === "week") {
			buttonLabel = `${t(($) => $.week)} ${formatDate(selectedDate, "w")}`;
		} else {
			buttonLabel = capitalize(formatDate(selectedDate, "MMMM yyyy"));
		}
	}

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					id={buttonId}
					className="justify-start font-normal"
				>
					<div className="flex items-center gap-2">
						<CalendarIcon size="1rem" />
						<p>{buttonLabel}</p>
					</div>
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<Calendar
					mode="single"
					required
					selected={selectedDate}
					onSelect={handleDayClick}
					modifiers={modifiers}
					modifiersClassNames={{ today: "", ...modifiersClassNames }}
					{...calendarProps}
				/>
			</PopoverContent>
		</Popover>
	);
}
