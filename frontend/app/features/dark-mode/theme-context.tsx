import { createContext } from "react";

export type Theme = "dark" | "light" | "system";

export const ThemeProviderContext = createContext<{
	theme: Theme;
	setTheme: (theme: Theme) => void;
}>({
	theme: "system",
	setTheme: () => null,
});
