import { parseAsStringLiteral, useQueryState } from "nuqs";
import type { ReactNode } from "react";
import { ViewContext } from "./use-view";
import { views } from "./views";

const parseAsView = parseAsStringLiteral(views);

export function ViewProvider({ children }: { children: ReactNode }) {
	const [view, setView] = useQueryState(
		"view",
		parseAsView.withDefault("day"),
	);

	return <ViewContext value={{ view, setView }}>{children}</ViewContext>;
}
