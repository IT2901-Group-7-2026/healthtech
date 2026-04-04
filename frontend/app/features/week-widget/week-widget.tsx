import { useDate } from "@/features/date-picker/use-date";
import { WeeklyPopup } from "@/features/popups/weekly-popup";
import { getTimeslotSegments } from "@/features/week-widget/timeslot-segments";
import { useFormatDate } from "@/hooks/use-format-date.js";
import { TIMEZONE } from "@/i18n/locale";
import { DangerLevels } from "@/lib/danger-levels";
import type { Aggregation } from "@/lib/dto";
import type { TimeBucketStatus } from "@/lib/time-bucket-types";
import { cn } from "@/lib/utils";
import type { TZDate } from "@date-fns/tz";
import { DialogDescription } from "@radix-ui/react-dialog";
import {
	addHours,
	getMinutes,
	getUnixTime,
	isSameWeek,
	startOfHour,
} from "date-fns";
import { type CSSProperties, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePopup } from "../popups/use-popup";

const GRID_COLUMNS = "3.5rem repeat(7, 1fr)";

function buildGridRows(rowCount: number): string {
	return `repeat(${rowCount}, 2.5rem)`;
}

function buildTimeBucketLookup(
	data: Array<TimeBucketStatus>,
	currentWeekStart: TZDate,
	dayStartHour: number,
	dayEndHour: number,
): Map<number, Array<TimeBucketStatus>> {
	const lookup = new Map<number, Array<TimeBucketStatus>>();

	for (const timeBucket of data) {
		const hour = timeBucket.time.getHours();
		const isInCurrentWeek = isSameWeek(currentWeekStart, timeBucket.time, {
			in: TIMEZONE,
		});
		const isWithinDayBounds = hour >= dayStartHour && hour < dayEndHour;

		if (!(isInCurrentWeek && isWithinDayBounds)) {
			continue;
		}

		const hourKey = startOfHour(timeBucket.time).getTime();
		const existing = lookup.get(hourKey) ?? [];
		existing.push(timeBucket);
		lookup.set(hourKey, existing);
	}

	return lookup;
}

interface WeekWidgetProps {
	dayStartHour?: number;
	dayEndHour?: number;
	isCellDisabled?: (date: TZDate) => boolean;
	isDayDisabled?: (date: TZDate) => boolean;
	isWeekDisabled?: (startOfWeek: TZDate) => boolean;
	data: Array<TimeBucketStatus>;
	aggregation?: Aggregation;
}

export function WeekWidget({
	dayStartHour = 8,
	dayEndHour = 16,
	isCellDisabled,
	isDayDisabled,
	data,
	aggregation,
}: WeekWidgetProps) {
	const { visible, closePopup, openPopup } = usePopup();
	const formatDate = useFormatDate();
	const { date } = useDate();
	const { t, i18n } = useTranslation();

	const [selectedTimeBucket, setSelectedTimeBucket] =
		useState<TimeBucketStatus | null>(null);

	const timeSlotSegments = getTimeslotSegments({
		selectedDate: date,
		formatDate,
		dayStartHour,
		dayEndHour,
		isCellDisabled,
		isDayDisabled,
	});

	function handleHourClick(timeBucket: TimeBucketStatus): void {
		setSelectedTimeBucket(timeBucket);
		openPopup();
	}

	function formatTimeBucketTitle(timeBucket: TimeBucketStatus): string {
		const day = formatDate(
			timeBucket.time,
			i18n.language === "en" ? "MMMM dd, yyyy" : "dd. MMMM yyyy",
		);
		const start = formatDate(timeBucket.time, "p");
		const end = formatDate(addHours(timeBucket.time, 1), "p");

		return t(($) => $.popup.eventTitle, { day, start, end });
	}

	const timeBucketsByHour = buildTimeBucketLookup(
		data,
		timeSlotSegments[0].date,
		dayStartHour,
		dayEndHour,
	);

	const rowCount = timeSlotSegments[0].cells.length;

	const dayColumnHeaders = (
		<div className="sticky top-0 z-30 flex-none">
			<div
				className="my-1.5 grid gap-x-3 gap-y-1 text-sm leading-6"
				style={{
					gridTemplateColumns: GRID_COLUMNS,
				}}
			>
				<div />

				{timeSlotSegments.map((day) => (
					<div
						key={getUnixTime(day.date)}
						className="flex items-center justify-center"
					>
						<p
							className={cn(
								"flex items-center",
								day.isToday
									? "font-semibold"
									: "text-muted-foreground",
							)}
						>
							{day.shortName}{" "}
							<span
								className={cn(
									"ml-1.5",
									day.isToday &&
										"flex size-6 items-center justify-center rounded-full bg-foreground font-bold text-secondary",
								)}
							>
								{day.dayOfMonthWithZero}
							</span>
						</p>
					</div>
				))}
			</div>
		</div>
	);

	const timeLabels = timeSlotSegments[0].cells.map((cell, cellIndex) => {
		const isOnTheHour = getMinutes(cell.date) === 0;
		if (!isOnTheHour) {
			return null;
		}

		return (
			<div
				key={`time-${getUnixTime(cell.date)}`}
				className="-mt-1.5 flex items-start justify-end"
				style={{
					gridRowStart: cellIndex + 1,
					gridRowEnd: cellIndex + 2,
					gridColumnStart: 1,
					gridColumnEnd: 2,
				}}
			>
				<span className="text-muted-foreground text-xs tabular-nums">
					{cell.hourAndMinute}
				</span>
			</div>
		);
	});

	return (
		<>
			<div className="flex flex-col overflow-hidden px-1">
				<div className="flex flex-1 select-none flex-col overflow-hidden">
					<div className="isolate flex flex-1 flex-col overflow-auto">
						<div className="flex min-w-[500px] flex-none flex-col">
							{dayColumnHeaders}

							<div
								className="grid gap-x-3 gap-y-1"
								style={{
									gridTemplateColumns: GRID_COLUMNS,
									gridTemplateRows: buildGridRows(rowCount),
								}}
							>
								{timeLabels}

								{timeSlotSegments.map((day, dayIndex) =>
									day.cells.map((cell, cellIndex) => {
										const isFirstRow = cellIndex === 0;
										const isLastRow =
											cellIndex === day.cells.length - 1;

										const timeBuckets =
											timeBucketsByHour.get(
												cell.date.getTime(),
											) ?? [];

										const style = {
											gridRowStart: cellIndex + 1,
											gridRowEnd: cellIndex + 2,
											gridColumnStart: dayIndex + 2,
											gridColumnEnd: dayIndex + 3,
										};

										return (
											<Cell
												key={getUnixTime(cell.date)}
												timeBuckets={timeBuckets}
												isFirstRow={isFirstRow}
												isLastRow={isLastRow}
												style={style}
												handleClick={handleHourClick}
											/>
										);
									}),
								)}
							</div>
						</div>
					</div>
				</div>
			</div>

			{selectedTimeBucket && (
				<WeeklyPopup
					selectedAggregation={aggregation}
					title={formatTimeBucketTitle(selectedTimeBucket)}
					timeBucketStatus={selectedTimeBucket}
					open={visible}
					onClose={closePopup}
				>
					<DialogDescription className="font-medium text-xl">
						{t(($) => $.popup.exposureTitle)}
					</DialogDescription>
				</WeeklyPopup>
			)}
		</>
	);
}

interface CellProps {
	isFirstRow: boolean;
	isLastRow: boolean;
	timeBuckets: Array<TimeBucketStatus>;
	style?: CSSProperties;
	handleClick: (timeBucket: TimeBucketStatus) => void;
}

const Cell = ({
	isFirstRow,
	isLastRow,
	timeBuckets,
	style,
	handleClick,
}: CellProps) => {
	const rounding = "rounded-md";

	return (
		<div
			className={cn(
				"relative bg-card-highlight transition-colors",
				rounding,
				isFirstRow && "rounded-t-2xl",
				isLastRow && "rounded-b-2xl",
			)}
			style={style}
		>
			{timeBuckets.map((timeBucket) => {
				const minuteOffset = getMinutes(timeBucket.time);
				const topPercent = (minuteOffset / 60) * 100;
				const bottomPercent =
					minuteOffset === 0 ? 0 : ((60 - minuteOffset) / 60) * 100;
				const dangerColor = DangerLevels[timeBucket.dangerLevel].color;

				return (
					<button
						key={timeBucket.time.toISOString()}
						type="button"
						className={cn(
							"absolute inset-x-0 block cursor-pointer overflow-hidden",
							"transition-[filter,box-shadow] hover:brightness-90",
							rounding,
							`bg-${dangerColor}`,
						)}
						style={{
							top: `calc(${topPercent}% + 1px)`,
							bottom: `calc(${bottomPercent}% + 1px)`,
						}}
						onClick={() => handleClick(timeBucket)}
					/>
				);
			})}
		</div>
	);
};
