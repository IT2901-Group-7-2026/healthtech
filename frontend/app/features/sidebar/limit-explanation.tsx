import { DangerLevelDots } from "@/components/danger-level-dots";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

export function LimitExplanation() {
	const { t } = useTranslation();

	return (
		<Card muted={true}>
			<CardContent>
				<div className="grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-1.5">
					<div className="flex size-5 scale-75 items-center justify-center rounded-full border border-danger-border bg-danger-subtle">
						<DangerLevelDots dangerLevel="danger" size="sm" />
					</div>
					<p className="font-medium text-xs">{t(($) => $.limitExplanation.limitValue.label)}</p>
					<p className="col-start-2 text-xs">{t(($) => $.limitExplanation.limitValue.description)}</p>
				</div>
				<div className="grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-1">
					<div className="flex size-5 scale-75 items-center justify-center rounded-full border border-warning-border bg-warning-subtle">
						<DangerLevelDots dangerLevel="warning" size="sm" />
					</div>
					<p className="font-medium text-xs">{t(($) => $.limitExplanation.actionValue.label)}</p>
					<p className="col-start-2 text-xs">{t(($) => $.limitExplanation.actionValue.description)}</p>
				</div>
			</CardContent>
		</Card>
	);
}
