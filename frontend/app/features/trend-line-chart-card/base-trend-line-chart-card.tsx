import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";
import { useView } from "../views/use-view";

export function BaseTrendLineChartCard({ children }: PropsWithChildren) {
	const { view } = useView();
	const { t } = useTranslation();

	return (
		<Card className="max-w-lg">
			<CardHeader>
				<CardTitle>
					{t(($) => $.exposureTrendLineChartCard.title, {
						view: t(($) => $.views[view]).toLowerCase(),
					})}
				</CardTitle>
			</CardHeader>
			<CardContent>{children}</CardContent>
		</Card>
	);
}
