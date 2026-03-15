/** biome-ignore-all lint/correctness/noNestedComponentDefinitions: CustomDay is intentionally defined inside CalendarView for prop access. */

import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { DialogDescription } from "@/components/ui/dialog";
import {
	CalendarPopup,
	type CalendarPopupData,
} from "@/features/popups/calendar-popup";
import { getLocale } from "@/i18n/locale";
import type { DangerLevel } from "@/lib/danger-levels";
import type { Aggregation } from "@/lib/dto";
import type { TimeBucketStatus } from "@/lib/time-bucket-types";
import { cn } from "@/lib/utils";
import { useState } from "react";
import type { CalendarDay, Modifiers } from "react-day-picker";
import { useTranslation } from "react-i18next";
import { useDate } from "../date-picker/use-date";
import { usePopup } from "../popups/use-popup";
import type { Sensor } from "../sensor-picker/sensors";

type CalendarProps = {
	selectedDay: Date;
	exposureType?: Sensor;
	selectedAggregation?: Aggregation;
	data: Array<TimeBucketStatus>;
};

export function CalendarWidget({
	selectedDay,
	data,
	selectedAggregation,
}: CalendarProps) {
	const { t, i18n } = useTranslation();
	const { visible, openPopup, closePopup } = usePopup();
	const { setDate } = useDate();

	const [popupData, setPopupData] = useState<{
		day: Date | null;
		exposures: CalendarPopupData | null;
	}>({ day: null, exposures: null });

	const safeDays = data
		.filter((d) => d.dangerLevel === "safe")
		.map((d) => d.time);

	const warningDays = data
		.filter((d) => d.dangerLevel === "warning")
		.map((d) => d.time);

	const dangerDays = data
		.filter((d) => d.dangerLevel === "danger")
		.map((d) => d.time);

	function handleDayClick(clickedDay: Date) {
		const utcDate = new Date(
			Date.UTC(
				clickedDay.getFullYear(),
				clickedDay.getMonth(),
				clickedDay.getDate(),
			),
		);
		setDate(utcDate);

		const dayStatus = data.find(
			(d) => d.time.toDateString() === clickedDay.toDateString(),
		);

		if (!dayStatus) {
			return;
		}

		setPopupData({
			day: clickedDay,
			exposures: dayStatus.sensorDangerLevels ?? null,
		});

		openPopup();
	}

	return (
		<>
			<Card className="w-full">
				<Calendar
					locale={getLocale(i18n.language)}
					month={selectedDay}
					hideNavigation
					showWeekNumber
					weekStartsOn={1}
					onDayClick={handleDayClick}
					components={{
						DayButton: (props) => (
							<CustomDay
								{...props}
								handleDayClick={handleDayClick}
								data={data}
							/>
						),
					}}
					modifiers={{
						safe: safeDays,
						warning: warningDays,
						danger: dangerDays,
					}}
					className="w-full bg-transparent font-bold text-foreground [--cell-size:--spacing(6)] sm:[--cell-size:--spacing(10)] md:[--cell-size:--spacing(12)]"
					captionLayout="label"
					buttonVariant="default"
					mode="single"
				/>
			</Card>

			{/* interaction popup window */}
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

function getDayDangerLevel(
	day: Date,
	data: Array<TimeBucketStatus>,
): DangerLevel | null {
	const dayStatus = data.find(
		(d) => d.time.toDateString() === day.toDateString(),
	);

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
	handleDayClick: (day: Date) => void;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

function CustomDay({
	data,
	day,
	className,
	handleDayClick,
	...buttonProps
}: CustomDayProps) {
	const dangerLevel = getDayDangerLevel(day.date, data);
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
				"h-11/12 w-11/12 rounded-lg",
				!disabled && "cursor-pointer hover:brightness-85",
				bgClassname,
				className,
			)}
			{...buttonProps}
		/>
	);
}
