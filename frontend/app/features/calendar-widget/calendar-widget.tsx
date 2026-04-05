/** biome-ignore-all lint/correctness/noNestedComponentDefinitions: CustomDay is intentionally defined inside CalendarView for prop access. */

import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { DialogDescription } from "@/components/ui/dialog";
import { CalendarPopup, type CalendarPopupData } from "@/features/popups/calendar-popup";
import { getLocale, TIMEZONE } from "@/i18n/locale";
import type { DangerLevel } from "@/lib/danger-levels";
import { toTZDate } from "@/lib/date";
import type { Aggregation } from "@/lib/dto";
import type { TimeBucketStatus } from "@/lib/time-bucket-types";
import { cn } from "@/lib/utils";
import type { TZDate } from "@date-fns/tz";
import { isSameDay, startOfDay } from "date-fns";
import { useState } from "react";
import type { CalendarDay, Modifiers } from "react-day-picker";
import { useTranslation } from "react-i18next";
import { useDate } from "../date-picker/use-date";
import { usePopup } from "../popups/use-popup";
import type { Sensor } from "../sensor-picker/sensors";

type CalendarProps = {
	selectedDay: TZDate;
	exposureType?: Sensor;
	selectedAggregation?: Aggregation;
	data: Array<TimeBucketStatus>;
};

export function CalendarWidget({ selectedDay, data, selectedAggregation }: CalendarProps) {
	const { t, i18n } = useTranslation();
	const { visible, openPopup, closePopup } = usePopup();
	const { setDate } = useDate();

	const [popupData, setPopupData] = useState<{
		day: TZDate | null;
		exposures: CalendarPopupData | null;
	}>({ day: null, exposures: null });

	const safeDays = data.filter((d) => d.dangerLevel === "safe").map((d) => d.time);

	const warningDays = data.filter((d) => d.dangerLevel === "warning").map((d) => d.time);

	const dangerDays = data.filter((d) => d.dangerLevel === "danger").map((d) => d.time);

	function handleDayClick(clickedDay: TZDate) {
		const selectedDate = startOfDay(clickedDay);
		setDate(selectedDate);

		const dayStatus = data.find((d) => isSameDay(d.time, selectedDate, { in: TIMEZONE }));

		if (!dayStatus) {
			return;
		}

		setPopupData({
			day: selectedDate,
			exposures: dayStatus.sensorDangerLevels ?? null,
		});

		openPopup();
	}

	return (
		<>
			<Card className="mr-auto w-full max-w-2xl">
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
					className="w-full bg-transparent font-bold text-foreground [--cell-size:2.25rem] sm:[--cell-size:2.75rem] md:[--cell-size:3rem]"
					classNames={{
						week: "mt-3 gap-3 flex w-full",
					}}
					captionLayout="label"
					buttonVariant="default"
					mode="single"
				/>
			</Card>

			{popupData.day && (
				<CalendarPopup
					title={popupData.day.toLocaleDateString(i18n.language, {
						day: "numeric",
						month: "long",
						year: "numeric",
					})}
					selectedDate={popupData.day}
					selectedAggregation={selectedAggregation}
					open={visible}
					onClose={closePopup}
					exposureData={popupData.exposures}
				>
					<DialogDescription className="font-medium text-xl">
						{t(($) => $.popup.exposureTitle)}
					</DialogDescription>
				</CalendarPopup>
			)}
		</>
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

	let bgClassname = "";
	if (dangerLevel === "safe") {
		bgClassname = "bg-safe";
	} else if (dangerLevel === "warning") {
		bgClassname = "bg-warning";
	} else if (dangerLevel === "danger") {
		bgClassname = "bg-danger";
	}

	return (
		<button
			type="button"
			disabled={disabled}
			className={cn(
				"h-full w-full rounded-lg",
				!disabled && "cursor-pointer hover:brightness-85",
				bgClassname,
				className,
			)}
			{...buttonProps}
		/>
	);
}
