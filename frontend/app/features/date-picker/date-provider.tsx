import { parseAsTZDate, today } from "@/lib/date";
import type { TZDate } from "@date-fns/tz";
import { useQueryState } from "nuqs";
import type { ReactNode } from "react";
import { DateContext } from "./use-date";

export function DateProvider({ children }: { children: ReactNode }) {
	const [date, setDate] = useQueryState<TZDate>(
		"date",
		parseAsTZDate.withDefault(today()),
	);

	return (
		<DateContext value={{ date, setDate: (d: TZDate) => setDate(d) }}>
			{children}
		</DateContext>
	);
}
