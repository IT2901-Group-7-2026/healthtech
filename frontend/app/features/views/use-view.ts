import { createContext, useContext } from "react";
import type { View } from "./views";

export const ViewContext = createContext<{
	view: View;
	setView: (day: View) => void;
} | null>(null);

export function useView() {
	const context = useContext(ViewContext);

	if (!context) {
		throw new Error("useView must be used within a ViewContextProvider");
	}

	return context;
}
