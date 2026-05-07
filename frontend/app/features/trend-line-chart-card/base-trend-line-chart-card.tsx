import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import type { PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";
import { useView } from "../views/use-view.ts";

export function BaseTrendLineChartCard({ children }: PropsWithChildren) {
	const { view } = useView();
	const { t } = useTranslation();

	return (
		<Card>
			<CardHeader>
				<CardTitle>
					{t(($) => $.exposureTrendLineChartCard.title[view], {
						view: t(($) => $.views[view]).toLowerCase(),
					})}
				</CardTitle>
			</CardHeader>
			<CardContent>{children}</CardContent>
		</Card>
	);
}
