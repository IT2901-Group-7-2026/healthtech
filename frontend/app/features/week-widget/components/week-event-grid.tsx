import { DangerLevels } from "@/lib/danger-levels";
import type { TimeBucketStatus } from "@/lib/time-bucket-types";
import { cn } from "@/lib/utils";
import {
	addHours,
	type Day,
	differenceInCalendarDays,
	getMinutes,
	isSameWeek,
	startOfWeek,
} from "date-fns";
import type { TimeSlotSegments } from "../types";

interface WeekEventGridProps {
	days: TimeSlotSegments;
	data: Array<TimeBucketStatus>;
	weekStartsOn: Day;
	rowHeight: number;
	handleHourClick: (timeBucketStatus: TimeBucketStatus) => void;
	dayStartHour: number;
	dayEndHour: number;
}

export function WeekEventGrid({
	days,
	data,
	weekStartsOn,
	rowHeight,
	handleHourClick,
	dayStartHour,
	dayEndHour,
}: WeekEventGridProps) {
	const minuteStep = 60;

	return (
		<div
			style={{
				display: "grid",
				gridTemplateColumns: `repeat(${days.length + 1}, minmax(0, 1fr))`,
				gridTemplateRows: `repeat(${days[0].cells.length}, minmax(${rowHeight}px, 1fr))`,
			}}
		>
			{data
				.filter(
					(timeBucketStatus) =>
						isSameWeek(days[0].date, timeBucketStatus.time, {
							weekStartsOn,
						}) &&
						addHours(timeBucketStatus.time, 1).getUTCHours() <=
							dayEndHour &&
						timeBucketStatus.time.getUTCHours() >= dayStartHour,
				)
				.map((timeBucketStatus) => {
					const start =
						timeBucketStatus.time.getUTCHours() - dayStartHour + 1;
					const end =
						addHours(timeBucketStatus.time, 1).getUTCHours() -
						dayStartHour +
						1;
					const paddingTop =
						((getMinutes(timeBucketStatus.time) % minuteStep) /
							minuteStep) *
						rowHeight;

					const paddingBottom =
						(rowHeight -
							((getMinutes(addHours(timeBucketStatus.time, 1)) %
								minuteStep) /
								minuteStep) *
								rowHeight) %
						rowHeight;

					return (
						<div
							key={timeBucketStatus.time.toISOString()}
							className="relative flex transition-all"
							style={{
								gridRowStart: start,
								gridRowEnd: end,
								gridColumnStart:
									differenceInCalendarDays(
										timeBucketStatus.time,
										startOfWeek(timeBucketStatus.time, {
											weekStartsOn,
										}),
									) + 2,
								gridColumnEnd: "span 1",
							}}
						>
							<button
								type="button"
								className={cn(
									"absolute inset-1 flex cursor-pointer flex-col overflow-y-auto rounded-md text-xs leading-5 transition",
									`bg-${DangerLevels[timeBucketStatus.dangerLevel].color}`,
									"border-t-2 border-t-muted-foreground border-dotted",
									`${timeBucketStatus.time.getUTCHours() === dayStartHour && "border-t-0"} `,
									"hover:brightness-85",
								)}
								style={{
									top: paddingTop,
									bottom: paddingBottom,
								}}
								onClick={() =>
									handleHourClick(timeBucketStatus)
								}
							/>
						</div>
					);
				})}
		</div>
	);
}
