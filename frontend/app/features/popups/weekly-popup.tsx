import { Card } from "@/components/ui/card";
import type { Aggregation } from "@/lib/dto";
import type { TimeBucketStatus } from "@/lib/time-bucket-types";
import { t } from "i18next";
import { BasePopup } from "./base-popup";

interface WeeklyPopupProps {
	title: string;
	timeBucketStatus: TimeBucketStatus;
	selectedAggregation?: Aggregation;
	open: boolean;
	onClose: () => void;
	children?: React.ReactNode;
}

//TODO: Show sensorDangerLevels like in calendar-popup
export function WeeklyPopup({
	title,
	timeBucketStatus,
	open,
	onClose,
	children,
	selectedAggregation,
}: WeeklyPopupProps) {
	return (
		<BasePopup
			title={title}
			relevantDate={timeBucketStatus.time}
			open={open}
			selectedAggregation={selectedAggregation}
			onClose={onClose}
		>
			{children}
			<div className="flex flex-col gap-2">
				{timeBucketStatus.dangerLevel && (
					<Card className="p-2 md:p-5">
						<div className="flex flex-col justify-start gap-2">
							<div
								className={`text-${timeBucketStatus.dangerLevel}`}
							>
								{t(
									($) =>
										$.popup[timeBucketStatus.dangerLevel],
								)}
							</div>
							<div>{t(($) => $.popup.openDaily)}</div>
						</div>
					</Card>
				)}
			</div>
		</BasePopup>
	);
}
