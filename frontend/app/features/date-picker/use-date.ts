import type { TZDate } from "@date-fns/tz";
import { createContext, useContext } from "react";

export type DateContextValue = {
	date: TZDate;
	setDate: (date: TZDate) => void;
	navigate: {
		previousValue: TZDate;
		nextValue: TZDate;
		previous: () => void;
		next: () => void;
	};
	selection: {
		start: TZDate;
		end: TZDate;
	};
};

export const DateContext = createContext<DateContextValue | null>(null);

export const useDate = (): DateContextValue => {
	const context = useContext(DateContext);

	if (!context) {
		throw new Error("useDateContext must be used within a DateContextProvider");
	}

	return context;
};
