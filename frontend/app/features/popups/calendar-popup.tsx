import { DailyNotes } from "@/components/daily-notes";
import { ExposureBadge } from "@/components/exposure-badge";
import { Card } from "@/components/ui/card";
import { BasePopup } from "@/features/popups/base-popup";
import type { DangerLevel } from "@/lib/danger-levels";
import type { Aggregation } from "@/lib/dto";
import type { Sensor } from "@/lib/sensors";
import type { TZDate } from "@date-fns/tz";
import { t } from "i18next";

type CalendarPopupProps = {
	title: string;
	selectedDate: TZDate;
	selectedAggregation?: Aggregation;
	exposureData?: CalendarPopupData | null;
	open: boolean;
	onClose: () => void;
	children?: React.ReactNode;
};

export type CalendarPopupData = Partial<Record<Sensor, DangerLevel>>;

export function CalendarPopup({
	exposureData,
	title,
	selectedDate,
	selectedAggregation,
	open,
	onClose,
	children,
}: CalendarPopupProps) {
	return (
		<BasePopup
			title={title}
			relevantDate={selectedDate}
			selectedAggregation={selectedAggregation}
			open={open}
			onClose={onClose}
		>
			{children}
			{exposureData && (
				<Card className="p-2 md:p-5">
					{Object.entries(exposureData).map(([sensor, danger]) => (
						<div key={sensor} className="flex justify-start gap-2">
							<ExposureBadge sensor={sensor as Sensor} dangerLevel={danger}>
								{t(($) => $.sensors[sensor as Sensor])}
							</ExposureBadge>

							<span className="text-muted-foreground">{"->"}</span>
							<div className={`text-${danger}`}>{t(($) => $.popup[danger])}</div>
						</div>
					))}
				</Card>
			)}
			<h2 className="pt-4 font-bold">{t(($) => $.popup.notesTitle)}</h2>
			<DailyNotes popUpOverride={true} />
		</BasePopup>
	);
}
