import { dangerLevels } from "@/lib/danger-levels";
import { cn } from "@/lib/utils";
import { type Day, getDay, getMinutes, isSameWeek } from "date-fns";
import type { Days, WeekEvent } from "../types";

export function WeekEventGrid({
	days,
	events,
	weekStartsOn,
	minuteStep,
	rowHeight,
	handleEventClick,
	dayStartHour,
	dayEndHour,
}: {
	days: Days;
	events?: Array<WeekEvent>;
	weekStartsOn: Day;
	minuteStep: number;
	rowHeight: number;
	handleEventClick: (event: WeekEvent) => void;
	dayStartHour: number;
	dayEndHour: number;
}) {
	return (
		<div
			style={{
				display: "grid",
				gridTemplateColumns: `repeat(${days.length + 1}, minmax(0, 1fr))`,
				gridTemplateRows: `repeat(${days[0].cells.length}, minmax(${rowHeight}px, 1fr))`,
			}}
		>
			{(events || [])
				.filter(
					(event) =>
						isSameWeek(days[0].date, event.startDate) &&
						event.endDate.getUTCHours() <= dayEndHour &&
						event.startDate.getUTCHours() >= dayStartHour,
				)
				.map((event) => {
					const start = event.startDate.getUTCHours() - dayStartHour + 1;
					const end = event.endDate.getUTCHours() - dayStartHour + 1;
					const paddingTop =
						((getMinutes(event.startDate) % minuteStep) / minuteStep) *
						rowHeight;

					const paddingBottom =
						(rowHeight -
							((getMinutes(event.endDate) % minuteStep) / minuteStep) *
								rowHeight) %
						rowHeight;

					return (
						<div
							key={event.startDate.toISOString()}
							className="relative flex transition-all"
							style={{
								gridRowStart: start,
								gridRowEnd: end,
								gridColumnStart: getDay(event.startDate) - weekStartsOn + 2,
								gridColumnEnd: "span 1",
							}}
						>
							<button
								type="button"
								className={cn(
									"absolute inset-1 flex cursor-pointer flex-col overflow-y-auto rounded-md text-xs leading-5 transition",
									`bg-${dangerLevels[event.dangerLevel].color}`,
									"border-t-2 border-t-muted-foreground border-dotted",
									`${event.startDate.getUTCHours() === dayStartHour && "border-t-0"} `,
									"hover:brightness-85",
								)}
								style={{
									top: paddingTop,
									bottom: paddingBottom,
								}}
								onClick={() => handleEventClick(event)}
							/>
						</div>
					);
				})}
		</div>
	);
}
