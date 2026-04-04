import { useDate } from "@/features/date-picker/use-date";
import { WeeklyPopup } from "@/features/popups/weekly-popup";
import { useFormatDate } from "@/hooks/use-format-date.js";
import { TIMEZONE } from "@/i18n/locale";
import { DangerLevels } from "@/lib/danger-levels";
import { toTZDate } from "@/lib/date";
import type { Aggregation } from "@/lib/dto";
import type { TimeBucketStatus } from "@/lib/time-bucket-types";
import { cn } from "@/lib/utils";
import { DialogDescription } from "@radix-ui/react-dialog";
import {
	addDays,
	addHours,
	eachDayOfInterval,
	eachHourOfInterval,
	getMinutes,
	getUnixTime,
	isSameWeek,
	isToday,
	setHours,
	startOfDay,
	startOfHour,
	startOfWeek,
} from "date-fns";
import { type CSSProperties, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePopup } from "../popups/use-popup";

const GRID_COLUMNS = "3.5rem repeat(7, 1fr)";

function buildGridRows(rowCount: number): string {
	return `repeat(${rowCount}, 2.5rem)`;
}

interface WeekWidgetProps {
	dayStartHour?: number;
	dayEndHour?: number;
	data: Array<TimeBucketStatus>;
	aggregation?: Aggregation;
}

export function WeekWidget({
	dayStartHour = 8,
	dayEndHour = 16,
	data,
	aggregation,
}: WeekWidgetProps) {
	const { visible, closePopup, openPopup } = usePopup();
	const formatDate = useFormatDate();
	const { date: selectedDate } = useDate();
	const { t, i18n } = useTranslation();

	const [selectedTimeBucket, setSelectedTimeBucket] =
		useState<TimeBucketStatus | null>(null);

	const daysInWeek = eachDayOfInterval({
		start: startOfWeek(selectedDate),
		end: addDays(startOfWeek(selectedDate), 6),
	}).map(toTZDate);

	const timeSlotSegments = daysInWeek.map((day) => {
		const start = setHours(startOfDay(day), dayStartHour);
		const end = setHours(startOfDay(day), dayEndHour);

		const timeSlots = eachHourOfInterval({ start, end }).map(toTZDate);

		return {
			date: day,
			timeSlots,
		};
	});

	function handleSegmentClick(timeBucket: TimeBucketStatus): void {
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

	const visibleTimeBuckets = data.filter((timeBucket) => {
		const hour = timeBucket.time.getHours();

		return (
			isSameWeek(daysInWeek[0], timeBucket.time, { in: TIMEZONE }) &&
			hour >= dayStartHour &&
			hour < dayEndHour
		);
	});

	const timeBucketsByHour = groupTimeBucketsByHour(visibleTimeBuckets);
	const rowCount = timeSlotSegments[0].timeSlots.length;

	return (
		<>
			<div className="flex flex-col overflow-hidden px-1">
				<div className="flex flex-1 select-none flex-col overflow-hidden">
					<div className="isolate flex flex-1 flex-col overflow-auto">
						<div className="flex min-w-[500px] flex-none flex-col">
							{/* Column headers */}
							<div className="sticky top-0 z-30 flex-none">
								<div
									className="my-1.5 grid gap-x-3 gap-y-1 text-sm leading-6"
									style={{
										gridTemplateColumns: GRID_COLUMNS,
									}}
								>
									<div />

									{timeSlotSegments.map((segment) => {
										const today = isToday(segment.date);
										const weekday = formatDate(
											segment.date,
											"EEE",
										);
										const date = formatDate(
											segment.date,
											"dd",
										);

										return (
											<div
												key={getUnixTime(segment.date)}
												className="flex items-center justify-center"
											>
												<p
													className={cn(
														"flex items-center",
														today
															? "font-semibold"
															: "text-muted-foreground",
													)}
												>
													{weekday}{" "}
													<span
														className={cn(
															"ml-1.5",
															today &&
																"flex size-6 items-center justify-center rounded-full bg-foreground font-bold text-secondary",
														)}
													>
														{date}
													</span>
												</p>
											</div>
										);
									})}
								</div>
							</div>

							<div
								className="grid gap-x-3 gap-y-1"
								style={{
									gridTemplateColumns: GRID_COLUMNS,
									gridTemplateRows: buildGridRows(rowCount),
								}}
							>
								{/* Time labels */}
								{timeSlotSegments[0].timeSlots.map(
									(timeSlot, cellIndex) => {
										const isOnTheHour =
											getMinutes(timeSlot) === 0;

										if (!isOnTheHour) {
											return <div />;
										}

										return (
											<div
												key={`time-${getUnixTime(timeSlot)}`}
												className="-mt-1.5 flex items-start justify-end"
												style={{
													gridRowStart: cellIndex + 1,
													gridRowEnd: cellIndex + 2,
													gridColumnStart: 1,
													gridColumnEnd: 2,
												}}
											>
												<span className="text-muted-foreground text-xs tabular-nums">
													{formatDate(
														timeSlot,
														"HH:mm",
													)}
												</span>
											</div>
										);
									},
								)}

								{/* Time slot cells */}
								{timeSlotSegments.map((day, dayIndex) =>
									day.timeSlots.map(
										(timeSlot, timeSlotIndex) => {
											const isFirstRow =
												timeSlotIndex === 0;
											const isLastRow =
												timeSlotIndex ===
												day.timeSlots.length - 1;

											const timeBuckets =
												timeBucketsByHour.get(
													timeSlot.getTime(),
												) ?? [];

											const style = {
												gridRowStart: timeSlotIndex + 1,
												gridRowEnd: timeSlotIndex + 2,
												gridColumnStart: dayIndex + 2,
												gridColumnEnd: dayIndex + 3,
											};

											return (
												<Cell
													key={getUnixTime(timeSlot)}
													timeBuckets={timeBuckets}
													isFirstRow={isFirstRow}
													isLastRow={isLastRow}
													style={style}
													onSegmentClick={
														handleSegmentClick
													}
												/>
											);
										},
									),
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

function groupTimeBucketsByHour(timeBuckets: Array<TimeBucketStatus>) {
	const lookup = new Map<number, Array<TimeBucketStatus>>();

	for (const timeBucket of timeBuckets) {
		const hourKey = startOfHour(timeBucket.time).getTime();
		const group = lookup.get(hourKey) ?? [];

		group.push(timeBucket);
		lookup.set(hourKey, group);
	}

	return lookup;
}

interface CellProps {
	isFirstRow: boolean;
	isLastRow: boolean;
	timeBuckets: Array<TimeBucketStatus>;
	style?: CSSProperties;
	onSegmentClick: (timeBucket: TimeBucketStatus) => void;
}

function Cell({
	isFirstRow,
	isLastRow,
	timeBuckets,
	style,
	onSegmentClick,
}: CellProps) {
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
						onClick={() => onSegmentClick(timeBucket)}
					/>
				);
			})}
		</div>
	);
}
