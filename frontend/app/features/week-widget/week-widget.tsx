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
	getUnixTime,
	isSameWeek,
	isToday,
	setHours,
	startOfDay,
	startOfHour,
	startOfWeek,
} from "date-fns";
import { Link, type To } from "react-router";

// ensure alignment between time-labels and hour slots
const ROW_HEIGHT = "h-10";
const CELL_GAP = "gap-y-1";
const HEADER_HEIGHT = "h-6";
const PADDING_Y = "py-1.5";

interface WeekWidgetProps {
	dayStartHour?: number;
	dayEndHour?: number;
	data: Array<TimeBucketStatus>;
	buildLink?: (dateQueryParam: string) => To | null;
}

export function WeekWidget({ dayStartHour = 8, dayEndHour = 16, data, buildLink }: WeekWidgetProps) {
	const formatDate = useFormatDate();
	const { date: selectedDate } = useDate();

	const daysInWeek = eachDayOfInterval({
		start: startOfWeek(selectedDate),
		end: addDays(startOfWeek(selectedDate), 6),
	}).map(toTZDate);

	const timeSlotSegments = daysInWeek.map((day) => {
		const start = setHours(startOfDay(day), dayStartHour);
		const end = setHours(startOfDay(day), dayEndHour);
		return {
			date: day,
			timeSlots: eachHourOfInterval({ start, end }).map(toTZDate),
		};
	});

	const visibleTimeBuckets = data.filter((timeBucket) => {
		const hour = timeBucket.time.getHours();
		return (
			isSameWeek(daysInWeek[0], timeBucket.time, { in: TIMEZONE }) && hour >= dayStartHour && hour <= dayEndHour
		);
	});

	const timeBucketsByHour = groupTimeBucketsByHour(visibleTimeBuckets);
	const createLink = buildLink ?? ((d: string) => `?view=Day&date=${d}`);

	return (
		<div className="overflow-hidden">
			<div className="isolate overflow-x-auto">
				<div className="flex">
					{/* Time-label column */}
					<div className={cn("flex shrink-0 flex-col", CELL_GAP, PADDING_Y)}>
						{/* empty div because the time label column has no header */}
						<div className={HEADER_HEIGHT} />

						{timeSlotSegments[0].timeSlots.map((slot) => (
							<div key={`time-${getUnixTime(slot)}`} className={cn("pr-1 leading-0", ROW_HEIGHT)}>
								<span className="text-muted-foreground text-xs tabular-nums">
									{formatDate(slot, "HH:mm")}
								</span>
							</div>
						))}
					</div>

					{/* Day columns */}
					{timeSlotSegments.map((segment) => {
						const formattedDate = formatDate(segment.date, "yyyy-MM-dd");
						const linkTarget = createLink(formattedDate);
						const today = isToday(segment.date);
						const weekday = formatDate(segment.date, "EEE");
						const date = formatDate(segment.date, "dd");

						const columnContent = (
							<>
								{/* Column header */}
								<div className={cn("flex items-center justify-center px-1 text-sm", HEADER_HEIGHT)}>
									<p
										className={cn(
											"flex items-center justify-center",
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

								{/* Cells */}
								{segment.timeSlots.map((timeSlot, timeSlotIndex) => {
									const isFirstRow = timeSlotIndex === 0;
									const isLastRow = timeSlotIndex === segment.timeSlots.length - 1;
									// Each hour slot maps to at most one bucket.
									// If multiple buckets fall in the same hour, the highest danger
									// level wins — see groupTimeBucketsByHour for that logic.
									const timeBucket = timeBucketsByHour.get(startOfHour(timeSlot).getTime());

									return (
										<Cell
											key={getUnixTime(timeSlot)}
											timeBucket={timeBucket}
											isFirstRow={isFirstRow}
											isLastRow={isLastRow}
										/>
									);
								})}
							</>
						);

						if (linkTarget === null) {
							return (
								<div
									key={getUnixTime(segment.date)}
									className={cn("flex min-w-20 flex-1 flex-col rounded-xl p-1.5", CELL_GAP)}
								>
									{columnContent}
								</div>
							);
						}

						return (
							<Link
								key={getUnixTime(segment.date)}
								to={linkTarget}
								className={cn(
									"flex min-w-20 flex-1 flex-col rounded-xl p-1.5",
									"transition-colors hover:bg-secondary",
									CELL_GAP,
								)}
								aria-label={`View day details for ${formattedDate}`}
							>
								{columnContent}
							</Link>
						);
					})}
				</div>
			</div>
		</div>
	);
}

function groupTimeBucketsByHour(timeBuckets: Array<TimeBucketStatus>) {
	const lookup = new Map<number, TimeBucketStatus>();
	for (const timeBucket of timeBuckets) {
		lookup.set(startOfHour(timeBucket.time).getTime(), timeBucket);
	}
	return lookup;
}

interface CellProps {
	isFirstRow: boolean;
	isLastRow: boolean;
	timeBucket: TimeBucketStatus | undefined;
}

function Cell({ isFirstRow, isLastRow, timeBucket }: CellProps) {
	const dangerLevel = timeBucket?.dangerLevel;

	return (
		<div
			className={cn(
				"relative rounded-md border",
				isFirstRow && "rounded-t-xl",
				isLastRow && "rounded-b-xl",
				ROW_HEIGHT,
				dangerLevel && [dangerlevelStyles[dangerLevel].bgSubtle, dangerlevelStyles[dangerLevel].border],
			)}
		>
			{dangerLevel && <DangerLevelDots dangerLevel={dangerLevel} className="absolute right-1 bottom-1" />}
		</div>
	);
}
