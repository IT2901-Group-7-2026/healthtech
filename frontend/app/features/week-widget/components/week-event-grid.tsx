import { DangerLevels } from "@/lib/danger-levels";
import type { TimeBucketStatus } from "@/lib/time-bucket-types";
import { cn } from "@/lib/utils";
import {
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
	const rowCount = dayEndHour - dayStartHour + 1;

	return (
		<div
			style={{
				display: "grid",
				gridTemplateColumns: `repeat(${days.length + 1}, minmax(0, 1fr))`,
				gridTemplateRows: `repeat(${rowCount}, minmax(${rowHeight}px, 1fr))`,
			}}
		>
			{data
				.filter((timeBucketStatus) => {
					const hour = timeBucketStatus.time.getHours();

					return (
						isSameWeek(days[0].date, timeBucketStatus.time, {
							weekStartsOn,
						}) &&
						hour >= dayStartHour &&
						hour < dayEndHour
					);
				})
				.map((timeBucketStatus) => {
					const hour = timeBucketStatus.time.getHours();
					const start = hour - dayStartHour + 1;
					const end = start + 1;

					const paddingTop =
						((getMinutes(timeBucketStatus.time) % minuteStep) /
							minuteStep) *
						rowHeight;

					const paddingBottom =
						(rowHeight -
							(((getMinutes(timeBucketStatus.time) + minuteStep) %
								minuteStep) /
								minuteStep) *
								rowHeight) %
						rowHeight;

					return (
						<div
							key={timeBucketStatus.time.toISOString()}
							className="relative"
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
									"absolute right-[2px] left-[2px] block cursor-pointer overflow-hidden rounded-[4px] border border-black/10",
									"transition-[filter,box-shadow] duration-150",
									"hover:brightness-90",
									`bg-${DangerLevels[timeBucketStatus.dangerLevel].color}`,
								)}
								style={{
									top: paddingTop + 1,
									bottom: paddingBottom + 1,
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
