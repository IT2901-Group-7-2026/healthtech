import { Card } from "@/components/ui/card";
import type { NoiseViewMode } from "app/routes/operator/sensors/noise";
import { t } from "i18next";
import type { WeekEvent } from "../week-widget/types";
import { BasePopup } from "./base-popup";

export function WeeklyPopup({
	title,
	event,
	open,
	onClose,
	children,
	viewMode,
}: {
	title: string;
	event: WeekEvent;
	viewMode?: NoiseViewMode;
	open: boolean;
	onClose: () => void;
	children?: React.ReactNode;
}) {
	return (
		<BasePopup
			title={title}
			relevantDate={event.startDate}
			open={open}
			relevantViewMode={viewMode}
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
