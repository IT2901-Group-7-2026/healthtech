import { DangerLevelDots } from "@/components/danger-level-dots.js";
import { useDate } from "@/features/date-picker/use-date";
import { useFormatDate } from "@/hooks/use-format-date.js";
import { TIMEZONE } from "@/i18n/locale";
import { dangerlevelStyles } from "@/lib/danger-levels";
import { toTZDate } from "@/lib/date";
import type { TimeBucketStatus } from "@/lib/time-bucket-types";
import { cn } from "@/lib/utils";
import {
	addDays,
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
import type { CSSProperties } from "react";
import { useView } from "../views/use-view";

const GRID_COLUMNS = "3.5rem repeat(7, 1fr)";

function buildGridRows(rowCount: number): string {
	return `repeat(${rowCount}, 2.5rem)`;
}

interface WeekWidgetProps {
	dayStartHour?: number;
	dayEndHour?: number;
	data: Array<TimeBucketStatus>;
}

export function WeekWidget({ dayStartHour = 8, dayEndHour = 16, data }: WeekWidgetProps) {
	const formatDate = useFormatDate();
	const { date: selectedDate, setDate } = useDate();
	const { setView } = useView();

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

	const visibleTimeBuckets = data.filter((timeBucket) => {
		const hour = timeBucket.time.getHours();

		return (
			isSameWeek(daysInWeek[0], timeBucket.time, { in: TIMEZONE }) && hour >= dayStartHour && hour <= dayEndHour
		);
	});

	const timeBucketsByHour = groupTimeBucketsByHour(visibleTimeBuckets);
	const rowCount = timeSlotSegments[0].timeSlots.length;

	const handleHourClick = (timeBucket: TimeBucketStatus) => {
		setDate(timeBucket.time);
		setView("day");
	};

	return (
		<div className="flex flex-col overflow-hidden px-1">
			<div className="flex flex-1 select-none flex-col overflow-hidden">
				<div className="isolate flex flex-1 flex-col overflow-auto">
					<div className="flex min-w-[500px] flex-none flex-col">
						{/* Column headers */}
						<div
							className="my-1.5 grid gap-x-3 gap-y-1 text-sm leading-6"
							style={{
								gridTemplateColumns: GRID_COLUMNS,
							}}
						>
							<div />

							{timeSlotSegments.map((segment) => {
								const today = isToday(segment.date);
								const weekday = formatDate(segment.date, "EEE");
								const date = formatDate(segment.date, "dd");

								return (
									<div key={getUnixTime(segment.date)} className="flex items-center justify-center">
										<p
											className={cn(
												"flex items-center",
												!today && "text-muted-foreground",
												today && "font-semibold",
											)}
										>
											{weekday}{" "}
											<span
												className={cn(
													"ml-1.5",
													today && [
														"flex size-6 items-center justify-center rounded-full",
														"bg-foreground text-secondary",
													],
												)}
											>
												{date}
											</span>
										</p>
									</div>
								);
							})}
						</div>

						<div
							className="grid gap-x-3 gap-y-1"
							style={{
								gridTemplateColumns: GRID_COLUMNS,
								gridTemplateRows: buildGridRows(rowCount),
							}}
						>
							{/* Time labels */}
							{timeSlotSegments[0].timeSlots.map((timeSlot, cellIndex) => {
								const isOnTheHour = getMinutes(timeSlot) === 0;

								if (!isOnTheHour) {
									return <div />;
								}

								return (
									<div
										key={`time-${getUnixTime(timeSlot)}`}
										className="flex items-start justify-end"
										style={{
											gridRowStart: cellIndex + 1,
											gridRowEnd: cellIndex + 2,
											gridColumnStart: 1,
											gridColumnEnd: 2,
										}}
									>
										<span className="text-muted-foreground text-xs tabular-nums">
											{formatDate(timeSlot, "HH:mm")}
										</span>
									</div>
								);
							})}

							{/* Time slot cells */}
							{timeSlotSegments.map((day, dayIndex) =>
								day.timeSlots.map((timeSlot, timeSlotIndex) => {
									const isFirstRow = timeSlotIndex === 0;
									const isLastRow = timeSlotIndex === day.timeSlots.length - 1;

									const timeBuckets = timeBucketsByHour.get(timeSlot.getTime()) ?? [];

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
											onHourClick={handleHourClick}
										/>
									);
								}),
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
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
	onHourClick: (timeBucket: TimeBucketStatus) => void;
}

function Cell({ isFirstRow, isLastRow, timeBuckets, style, onHourClick }: CellProps) {
	const rounding = "rounded-md";

	return (
		<div
			className={cn(
				"relative bg-secondary transition-colors",
				rounding,
				isFirstRow && "rounded-t-xl",
				isLastRow && "rounded-b-xl",
			)}
			style={style}
		>
			{timeBuckets.map((timeBucket) => {
				const minuteOffset = getMinutes(timeBucket.time);
				const topPercent = (minuteOffset / 60) * 100;
				const bottomPercent = minuteOffset === 0 ? 0 : ((60 - minuteOffset) / 60) * 100;

				const colorClassname = timeBucket.dangerLevel
					? cn(
							"border",
							dangerlevelStyles[timeBucket.dangerLevel].bgSubtle,
							dangerlevelStyles[timeBucket.dangerLevel].border,
						)
					: "";

				return (
					<button
						key={timeBucket.time.toISOString()}
						type="button"
						className={cn(
							"absolute inset-x-0 block cursor-pointer overflow-hidden",
							"transition-[filter,box-shadow] hover:brightness-90",
							rounding,
							isFirstRow && "rounded-t-xl",
							isLastRow && "rounded-b-xl",
							colorClassname,
						)}
						style={{
							top: `calc(${topPercent}% + 1px)`,
							bottom: `calc(${bottomPercent}% + 1px)`,
						}}
						onClick={() => onHourClick(timeBucket)}
					>
						<DangerLevelDots
							dangerLevel={timeBucket.dangerLevel ?? null}
							className="absolute right-1 bottom-1"
						/>
					</button>
				);
			})}
		</div>
	);
}
