import { useView } from "@/features/views/use-view";
import { TIMEZONE } from "@/i18n/locale";
import { parseAsTZDate, today } from "@/lib/date";
import type { TZDate } from "@date-fns/tz";
import {
	addDays,
	addMonths,
	addWeeks,
	endOfDay,
	endOfMonth,
	endOfWeek,
	startOfDay,
	startOfMonth,
	startOfWeek,
	subDays,
	subMonths,
	subWeeks,
} from "date-fns";
import { useQueryState } from "nuqs";
import { type ReactNode, useCallback } from "react";
import { DateContext, type DateContextValue } from "./use-date";

export function DateProvider({ children }: { children: ReactNode }) {
	const [date, setDateQueryState] = useQueryState<TZDate>("date", parseAsTZDate.withDefault(today()));

	const { view } = useView();

	let start: TZDate;
	let end: TZDate;

	let previousValue: TZDate;
	let nextValue: TZDate;

	if (view === "month") {
		start = startOfMonth(date, { in: TIMEZONE });
		end = endOfMonth(date, { in: TIMEZONE });

		previousValue = subMonths(date, 1);
		nextValue = addMonths(date, 1);
	} else if (view === "week") {
		start = startOfWeek(date, { in: TIMEZONE });
		end = endOfWeek(date, { in: TIMEZONE });

		previousValue = subWeeks(date, 1);
		nextValue = addWeeks(date, 1);
	} else {
		start = startOfDay(date, { in: TIMEZONE });
		end = endOfDay(date, { in: TIMEZONE });

		previousValue = subDays(date, 1);
		nextValue = addDays(date, 1);
	}

	// biome-ignore lint/nursery/noShadow: these should be named like this for clarity when used
	const setDate = useCallback((date: TZDate) => void setDateQueryState(date), [setDateQueryState]);

	const previous = useCallback(() => setDateQueryState(previousValue), [setDateQueryState, previousValue]);
	const next = useCallback(() => setDateQueryState(nextValue), [setDateQueryState, nextValue]);

	const value: DateContextValue = {
		setDate,
		date,
		selection: {
			start,
			end,
		},
		navigate: {
			previousValue,
			nextValue,
			previous,
			next,
		},
	};

	return <DateContext value={value}>{children}</DateContext>;
}
