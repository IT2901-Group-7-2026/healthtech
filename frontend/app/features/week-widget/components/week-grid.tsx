import { getMinutes, getUnixTime } from "date-fns";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Cell, TimeSlotSegments } from "../types";

export function WeekGrid({
	days,
	rowHeight,
	CellContent,
}: {
	days: TimeSlotSegments;
	rowHeight: number;
	CellContent?: (cell: Cell) => ReactNode;
}) {
	return (
		<div
			style={{
				display: "grid",
				gridTemplateColumns: `repeat(${days.length + 1}, minmax(0, 1fr))`,
				gridTemplateRows: `repeat(${days[0].cells.length}, minmax(${rowHeight}px, 1fr))`,
			}}
		>
			{days.map((day, dayIndex) =>
				day.cells.map((cell, cellIndex) => (
					<div
						key={getUnixTime(cell.date)}
						className={cn(
							"relative border-card border-r border-l transition-colors",
							dayIndex === 0 ? "border-l-2" : "",
							dayIndex === days.length - 1 ? "border-r-2" : "",
							"bg-card-highlight",
							"border-t-2 border-t-card",
						)}
						style={{
							gridRowStart: cellIndex + 1,
							gridRowEnd: cellIndex + 2,
							gridColumnStart: dayIndex + 2,
							gridColumnEnd: dayIndex + 3,
						}}
					>
						{CellContent?.(cell)}
					</div>
				)),
			)}

			{days[0].cells.map(
				(cell, cellIndex) =>
					getMinutes(cell.date) === 0 && (
						<div
							key={getUnixTime(cell.date)}
							className="flex items-start justify-end pr-2 text-muted-foreground"
							style={{
								gridRowStart: cellIndex + 1,
								gridRowEnd: cellIndex + 2,
								gridColumnStart: 1,
								gridColumnEnd: 2,
							}}
						>
							<span className="text-md">
								{cell.hourAndMinute}
							</span>
						</div>
					),
			)}
		</div>
	);
}
