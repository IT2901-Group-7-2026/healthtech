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
import { ViewPicker } from "@/features/views/view-picker.js";
import { useView } from "@/features/views/use-view.js";

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
	withViewSelect?: boolean;
};

export function DatePicker({
	mode = "day",
	date,
	onDateChange,
	locale,
	withViewSelect,
	...props
}: DatePickerProps) {
	const formatDate = useFormatDate();
	const buttonId = React.useId();
	const { t, i18n } = useTranslation();
	const { view } = useView();

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
			buttonLabel = formatDate(
				selectedDate,
				i18n.language === "en" ? "MMMM dd, yyyy" : "dd. MMMM yyyy",
			);
		} else if (mode === "week") {
			buttonLabel = `${t(($) => $.week)} ${formatDate(selectedDate, "w, yyyy")}`;
		} else {
			buttonLabel = capitalize(formatDate(selectedDate, "MMMM yyyy"));
		}
	}

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

	const formattedView = t(($) => $[view]).toLowerCase();
	const selectionText = t(($) => $.viewSelectionText, { view: formattedView });

	const selectionSummary = selectionDetail.date
		? t(($) => $.dateSelectionSummarySingle, { date: selectionDetail.date })
		: t(($) => $.dateSelectionSummaryMultiple, {
				startDate: selectionDetail.startDate,
				endDate: selectionDetail.endDate,
			});

	return (
		<div className="flex gap-4 items-center">
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
				<PopoverContent
					className="w-auto p-3 flex flex-col gap-4"
					align="start"
				>
					{withViewSelect && <ViewPicker />}
					<Calendar
						mode="single"
						className="min-w-60 p-0"
						required
						selected={selectedDate}
						onSelect={handleDayClick}
						modifiers={modifiers}
						captionLayout="dropdown"
						modifiersClassNames={{
							today: "[&>button]:font-bold",
							...modifiersClassNames,
						}}
						footer={
							<p className="text-xs text-muted-foreground text-wrap mt-2">
								{selectionRecap}
							</p>
						}
						{...calendarProps}
					/>
				</PopoverContent>
			</Popover>

			<div className="flex flex-col">
				<p className="text-xs text-muted-foreground">{selectionText}</p>
				<p className="text-xs text-muted-foreground">{selectionSummary}</p>
			</div>
		</div>
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
