import { cn } from "@/lib/utils";
import { getUnixTime } from "date-fns";
import type { Days } from "../types";

export function WeekDaysHeader({ days }: { days: Days }) {
	return (
		<div className="sticky top-0 z-30 flex-none">
			<div className="grid grid-cols-8 text-sm leading-6">
				<div />
				{days.map((day, i) => (
					<div
						key={getUnixTime(day.date)}
						className={cn(
							`flex h-14 items-center justify-center border-card border-r border-b-2 border-l`,
							i === 0 ? "border-l-2" : "",
							i === days.length - 1 ? "border-r-2" : "",
						)}
					>
						<span
							className={
								day.isToday
									? "flex items-center font-semibold"
									: "text-muted-foreground"
							}
						>
							{day.shortName}{" "}
							<span
								className={`font-semibold ${
									day.isToday &&
									"ml-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-foreground font-bold text-secondary"
								}
								`}
							>
								{day.dayOfMonthWithZero}
							</span>
						</span>
					</div>
				))}
			</div>
		</div>
	);
}
