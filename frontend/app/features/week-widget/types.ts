import { type DangerLevel } from "@/lib/danger-levels.ts";
import { type useWeekView } from "./use-week-view.ts";

export type TimeSlotSegments = ReturnType<
	typeof useWeekView
>["timeSlotSegments"];
export type Cell = TimeSlotSegments[number]["cells"][number];

export type WeekEvent = {
	startDate: Date;
	endDate: Date;
	dangerLevel: DangerLevel;
};
