import { parseAsIsoDate, useQueryState } from "nuqs";
import type { ReactNode } from "react";
import { DateContext } from "./use-date";

export function DateProvider({ children }: { children: ReactNode }) {
	const [date, setDate] = useQueryState<Date>(
		"date",
		parseAsIsoDate.withDefault(new Date()),
	);

	return (
		<DateContext value={{ date, setDate: (d: Date) => setDate(d) }}>
			{children}
		</DateContext>
	);
}
