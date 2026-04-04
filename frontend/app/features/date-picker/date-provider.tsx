import { useView } from "@/features/views/use-view";
import { TIMEZONE } from "@/i18n/locale";
import { parseAsTZDate, today } from "@/lib/date";
import type { TZDate } from "@date-fns/tz";
import { endOfDay, endOfMonth, endOfWeek, startOfDay, startOfMonth, startOfWeek } from "date-fns";
import { useQueryState } from "nuqs";
import type { ReactNode } from "react";
import { DateContext } from "./use-date";

export function DateProvider({ children }: { children: ReactNode }) {
	const [date, setDate] = useQueryState<TZDate>("date", parseAsTZDate.withDefault(today()));

	const { view } = useView();

	let start: TZDate;
	let end: TZDate;

	if (view === "month") {
		start = startOfMonth(date, { in: TIMEZONE });
		end = endOfMonth(date, { in: TIMEZONE });
	} else if (view === "week") {
		start = startOfWeek(date, { in: TIMEZONE });
		end = endOfWeek(date, { in: TIMEZONE });
	} else {
		start = startOfDay(date, { in: TIMEZONE });
		end = endOfDay(date, { in: TIMEZONE });
	}

	const selection = { start, end };

	// biome-ignore lint/nursery/noShadow: these should be named like this for clarity
	return <DateContext value={{ date, selection, setDate: (date: TZDate) => setDate(date) }}>{children}</DateContext>;
}
