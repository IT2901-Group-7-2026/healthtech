import { Card } from "@/components/ui/card";
import type { Aggregation } from "@/lib/dto";
import { t } from "i18next";
import type { WeekEvent } from "../week-widget/types";
import { BasePopup } from "./base-popup";

export function WeeklyPopup({
	title,
	event,
	open,
	onClose,
	children,
	selectedAggregation,
}: {
	title: string;
	event: WeekEvent;
	selectedAggregation?: Aggregation;
	open: boolean;
	onClose: () => void;
	children?: React.ReactNode;
}) {
	return (
		<BasePopup
			title={title}
			relevantDate={event.startDate}
			open={open}
			selectedAggregation={selectedAggregation}
			onClose={onClose}
		>
			{children}
			<div className="flex flex-col gap-2">
				{event.dangerLevel && (
					<Card className="p-2 md:p-5">
						<div className="flex flex-col justify-start gap-2">
							<div className={`text-${event.dangerLevel}`}>
								{t(($) => $.popup[event.dangerLevel])}
							</div>
							<div>{t(($) => $.popup.openDaily)}</div>
						</div>
					</Card>
				)}
			</div>
		</BasePopup>
	);
}
