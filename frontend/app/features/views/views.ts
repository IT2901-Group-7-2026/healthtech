import { CalendarIcon, ColumnsIcon, Grid3X3Icon } from "lucide-react";

export const views = ["day", "week", "month"] as const;
export type View = (typeof views)[number];

export const DayViewIcon = CalendarIcon;
export const WeekViewIcon = ColumnsIcon;
export const MonthViewIcon = Grid3X3Icon;

export const getViewIcon = (view: View) => {
	switch (view) {
		case "day": {
			return DayViewIcon;
		}
		case "week": {
			return WeekViewIcon;
		}
		case "month": {
			return MonthViewIcon;
		}
	}
};
