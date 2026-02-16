import { createContext, useContext } from "react";

type ContextValue = {
	date: Date;
	setDate: (date: Date) => void;
};

export const DateContext = createContext<ContextValue | null>(null);

export const useDate = (): ContextValue => {
	const context = useContext(DateContext);

	if (!context) {
		throw new Error(
			"useDateContext must be used within a DateContextProvider",
		);
	}

	return context;
};
