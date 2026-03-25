import type { DangerLevel } from "@/lib/danger-levels";
import type { TZDate } from "@/lib/date";
import type { useWeekView } from "./use-week-view";

export type TimeSlotSegments = ReturnType<
	typeof useWeekView
>["timeSlotSegments"];
export type Cell = TimeSlotSegments[number]["cells"][number];

export type WeekEvent = {
	startDate: TZDate;
	endDate: TZDate;
	dangerLevel: DangerLevel;
};
