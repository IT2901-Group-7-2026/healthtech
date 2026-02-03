import { BasePopup } from "@/features/popups/base-popup";
import type { DangerLevel } from "@/lib/danger-levels";
import type { Sensor } from "@/lib/sensors";
import { cn } from "@/lib/utils";
import { t } from "i18next";
import { DailyNotes } from "../../components/daily-notes";
import { Card } from "../../components/ui/card";

type CalendarPopupProps = {
	title: string;
	selectedDate: Date;
	exposureData?: CalendarPopupData | null;
	open: boolean;
	onClose: () => void;
	children?: React.ReactNode;
};

export type CalendarPopupData = Record<Sensor, DangerLevel>;

export function CalendarPopup({
	exposureData,
	title,
	selectedDate,
	open,
	onClose,
	children,
}: CalendarPopupProps) {
	return (
		<BasePopup
			title={title}
			relevantDate={selectedDate}
			open={open}
			onClose={onClose}
		>
			{children}
			{exposureData && (
				<Card className="p-2 md:p-5">
					{Object.entries(exposureData).map(([sensor, danger]) => (
						<div key={sensor} className="flex justify-start gap-2">
							<span
								className={cn(
									"rounded-full text-center font-medium capitalize",
									`bg-${danger} ${danger === "danger" && "text-secondary"}`,
									"h-fit w-fit px-2",
								)}
							>
								{t(($) => $[sensor as Sensor])}
							</span>
							<span className="text-muted-foreground">{"->"}</span>
							<div className={`text-${danger}`}>
								{t(($) => $.popup[danger])}
							</div>
						</div>
					))}
				</Card>
			)}
			<h2 className="pt-4 font-bold">{t(($) => $.popup.notesTitle)}</h2>
			<DailyNotes popUpOverride={true} />
		</BasePopup>
	);
}
