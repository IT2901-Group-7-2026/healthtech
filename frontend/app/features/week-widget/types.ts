import type { DangerKey } from "@/lib/danger-levels";
import type { useWeekView } from "./use-week-view";

export type Days = ReturnType<typeof useWeekView>["days"];
export type Cell = Days[number]["cells"][number];

export type WeekEvent = {
	startDate: Date;
	endDate: Date;
	dangerLevel: DangerKey;
};
