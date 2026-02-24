/** biome-ignore-all lint/correctness/noNestedComponentDefinitions: CustomDay is intentionally defined inside CalendarView for prop access. */

import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { getLocale } from "@/i18n/locale";
import type { DangerLevel } from "@/lib/danger-levels";
import { cn } from "@/lib/utils";
import type { CalendarDay, Modifiers } from "react-day-picker";
import { useTranslation } from "react-i18next";

export type MonthData = Record<
	DangerLevel,
	Partial<Record<Sensor, Array<Date>>>
>;

type CalendarProps = {
	selectedDay: Date;
	exposureType?: Sensor;
	selectedViewMode?: NoiseViewMode;
	data: MonthData;
};

import { DialogDescription } from "@/components/ui/dialog";
import {
	CalendarPopup,
	type CalendarPopupData,
} from "@/features/popups/calendar-popup";
import type { NoiseViewMode } from "app/routes/operator/sensors/noise";
import { useState } from "react";
import { useDate } from "../date-picker/use-date";
import { usePopup } from "../popups/use-popup";
import type { Sensor } from "../sensor-picker/sensors";

export function CalendarWidget({
	selectedDay,
	data,
	selectedViewMode,
}: CalendarProps) {
	const { t, i18n } = useTranslation();
	const { visible, openPopup, closePopup } = usePopup();
	const { setDate } = useDate();

	const [popupData, setPopupData] = useState<{
		day: Date | null;
		exposures: CalendarPopupData | null;
	}>({ day: null, exposures: null });

	const dayKey = (d: Date) => d.toDateString();

	const safeDaysSet = new Set(Object.values(data.safe).flat().map(dayKey));
	const warningDaysSet = new Set(
		Object.values(data.warning).flat().map(dayKey),
	);
	const dangerDaysSet = new Set(
		Object.values(data.danger).flat().map(dayKey),
	);

	// Remove duplicates
	warningDaysSet.forEach((d) => {
		if (dangerDaysSet.has(d)) warningDaysSet.delete(d);
	});
	safeDaysSet.forEach((d) => {
		if (dangerDaysSet.has(d) || warningDaysSet.has(d))
			safeDaysSet.delete(d);
	});

	const safeDays = Array.from(safeDaysSet).map((s) => new Date(s));
	const warningDays = Array.from(warningDaysSet).map((s) => new Date(s));
	const dangerDays = Array.from(dangerDaysSet).map((s) => new Date(s));

	const hasData = (list: Array<Date>, d: Date) =>
		list.some((day) => day.toDateString() === d.toDateString());

	function getDayType(day: Date): Lowercase<DangerLevel> | "none" {
		if (hasData(safeDays, day)) return "safe";
		if (hasData(warningDays, day)) return "warning";
		if (hasData(dangerDays, day)) return "danger";
		return "none";
	}

	function handleDayClick(clickedDay: Date) {
		const utcDate = new Date(
			Date.UTC(
				clickedDay.getFullYear(),
				clickedDay.getMonth(),
				clickedDay.getDate(),
			),
		);
		setDate(utcDate);
		const type = getDayType(clickedDay);
		if (type === "none") return;
		const exposureData = getExposureData(clickedDay);
		setPopupData({ day: clickedDay, exposures: exposureData });
		openPopup();
	}

	function getExposureData(clickedDay: Date) {
		const exposureData: CalendarPopupData = {} as CalendarPopupData;

		(Object.keys(data) as Array<DangerLevel>).forEach((dangerKey) => {
			Object.entries(data[dangerKey]).forEach(([sensor, dates]) => {
				if (
					dates.some(
						(d) => d.toDateString() === clickedDay.toDateString(),
					)
				) {
					//Override lower danger with the higher one
					const prev = exposureData[sensor as Sensor];
					if (
						!prev ||
						(prev === "safe" && dangerKey !== "safe") ||
						(prev === "warning" && dangerKey === "danger")
					) {
						exposureData[sensor as Sensor] = dangerKey;
					}
				}
			});
		});
		return exposureData;
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
								getDayType={getDayType}
								handleDayClick={handleDayClick}
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
					selectedViewMode={selectedViewMode}
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

type CustomDayProps = {
	day: CalendarDay;
	modifiers: Modifiers;
	className?: string;
	getDayType: (day: Date) => Lowercase<DangerLevel> | "none";
	handleDayClick: (day: Date) => void;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

function CustomDay({
	day,
	className,
	getDayType,
	handleDayClick,
	...buttonProps
}: CustomDayProps) {
	const dayDate = day.date;
	const type = getDayType(dayDate);

	let relevantClassname = "cursor-pointer hover:brightness-85";
	if (type === "safe") relevantClassname = `bg-safe ${relevantClassname}`;
	else if (type === "warning")
		relevantClassname = `bg-warning ${relevantClassname}`;
	else if (type === "danger")
		relevantClassname = `bg-danger ${relevantClassname}`;
	else relevantClassname = "noData";

	return (
		<button
			type="button"
			disabled={relevantClassname === "noData"}
			className={cn(
				"h-11/12 w-11/12 rounded-lg",
				relevantClassname,
				className,
			)}
			{...buttonProps}
		/>
	);
}
