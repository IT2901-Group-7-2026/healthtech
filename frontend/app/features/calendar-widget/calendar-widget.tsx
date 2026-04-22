/** biome-ignore-all lint/correctness/noNestedComponentDefinitions: CustomDay is intentionally defined inside CalendarView for prop access. */

import { DangerLevelDots } from "@/components/danger-level-dots";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { getLocale, TIMEZONE } from "@/i18n/locale";
import { type DangerLevel, dangerlevelStyles } from "@/lib/danger-levels";
import { toTZDate } from "@/lib/date";
import type { TimeBucketStatus } from "@/lib/time-bucket-types";
import { cn } from "@/lib/utils";
import type { TZDate } from "@date-fns/tz";
import { isSameDay, startOfDay } from "date-fns";
import { useState } from "react";
import type { CalendarDay, Modifiers } from "react-day-picker";
import { useTranslation } from "react-i18next";
import { useDate } from "../date-picker/use-date";
import type { Sensor } from "../sensor-picker/sensors";
import { useView } from "../views/use-view";

type CalendarProps = {
	selectedDay: TZDate;
	exposureType?: Sensor;
	data: Array<TimeBucketStatus>;
	headerRight?: React.ReactNode;
};

export function CalendarWidget({ selectedDay, data }: CalendarProps) {
	const { t, i18n } = useTranslation();
	const { setDate } = useDate();
	const [showShareDataConfirmationMessage, setShowShareDataConfirmationMessage] = useState(false);
	const { setView } = useView();

	const safeDays = data.filter((d) => d.dangerLevel === "safe").map((d) => d.time);

	const warningDays = data.filter((d) => d.dangerLevel === "warning").map((d) => d.time);

	const dangerDays = data.filter((d) => d.dangerLevel === "danger").map((d) => d.time);

	function handleDayClick(clickedDay: TZDate) {
		const selectedDate = startOfDay(clickedDay);
		setDate(selectedDate);
		setView("day");
	}

	return (
		<div className="mr-auto w-full max-w-4xl">
			<div className="flex justify-end pb-4">
				<Button
					variant="outline"
					onClick={() => {
						setShowShareDataConfirmationMessage(true);

						setTimeout(() => {
							setShowShareDataConfirmationMessage(false);
						}, 5000); // Confirmation message duration in ms
					}}
				>
					{t(($) => $.share.hygienist.button)}
				</Button>

				{showShareDataConfirmationMessage && (
					<div className="text-green-600 text-xs">
						<div className="text-green-600 text-xs">{t(($) => $.share.hygienist.confirmation)}</div>
					</div>
				)}
			</div>
			<Calendar
				locale={getLocale(i18n.language)}
				month={selectedDay}
				hideNavigation={true}
				showWeekNumber={true}
				weekStartsOn={1}
				onDayClick={(clickedDay) => handleDayClick(toTZDate(clickedDay))}
				components={{
					DayButton: (props) => <CustomDay {...props} handleDayClick={handleDayClick} data={data} />,
				}}
				modifiers={{
					safe: safeDays,
					warning: warningDays,
					danger: dangerDays,
				}}
				className="w-full bg-transparent px-2 py-0 text-foreground"
				classNames={{
					week: "mt-3 gap-3 flex w-full",
					month_caption: "hidden",
					weekdays: "flex gap-3",
					day: "max-h-20 relative w-full h-full p-0 text-center [&:first-child[data-selected=true]_button]:rounded-l-md [&:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none",
				}}
				captionLayout="label"
				buttonVariant="default"
				mode="single"
			/>
		</div>
	);
}

function getDayDangerLevel(day: TZDate, data: Array<TimeBucketStatus>): DangerLevel | null {
	const dayStatus = data.find((d) => isSameDay(d.time, day, { in: TIMEZONE }));

	if (dayStatus) {
		return dayStatus.dangerLevel;
	}

	return null;
}

type CustomDayProps = {
	data: Array<TimeBucketStatus>;
	day: CalendarDay;
	modifiers: Modifiers;
	className?: string;
	handleDayClick: (day: TZDate) => void;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

function CustomDay({ data, day, className, handleDayClick, ...buttonProps }: CustomDayProps) {
	const dangerLevel = getDayDangerLevel(toTZDate(day.date), data);
	const disabled = dangerLevel === null;
	const isToday = buttonProps.modifiers?.today;

	const bgClassname = dangerLevel
		? cn("border-2", dangerlevelStyles[dangerLevel].bgSubtle, dangerlevelStyles[dangerLevel].border)
		: "";

	return (
		<button
			type="button"
			disabled={disabled}
			className={cn("relative h-full w-full rounded-lg", className)}
			{...buttonProps}
		>
			<div
				className={cn(
					"h-full w-full rounded-lg",
					!disabled && "cursor-pointer hover:brightness-85",
					bgClassname,
				)}
			/>
			<span
				className={cn(
					"pointer-events-none absolute inset-0 flex items-center justify-center text-sm",
					disabled && "text-muted-foreground",
				)}
			>
				<span
					className={cn(
						"flex size-7 items-center justify-center rounded-full",
						isToday && "bg-foreground text-background",
					)}
				>
					{day.date.getDate()}
				</span>
			</span>
			<DangerLevelDots
				dangerLevel={dangerLevel ?? null}
				className="pointer-events-none absolute right-2 bottom-2"
			/>
		</button>
	);
}
