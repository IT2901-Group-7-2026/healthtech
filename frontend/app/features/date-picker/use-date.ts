import type { TZDate } from "@date-fns/tz";
import { createContext, useContext } from "react";

type ContextValue = {
	date: TZDate;
	selection: { start: TZDate; end: TZDate };
	setDate: (date: TZDate) => void;
};

export const DateContext = createContext<ContextValue | null>(null);

export const useDate = (): ContextValue => {
	const context = useContext(DateContext);

	if (!context) {
		throw new Error("useDateContext must be used within a DateContextProvider");
	}

	return context;
};
