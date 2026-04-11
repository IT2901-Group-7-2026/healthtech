import { useDate } from "@/features/date-picker/use-date.js";
import type { Sensor } from "@/features/sensor-picker/sensors";
import { useView } from "@/features/views/use-view";
import type { View } from "@/features/views/views";
import { useFormatDate } from "@/hooks/use-format-date.js";
import { useIsMobile } from "@/hooks/use-mobile";
import { type DangerLevel, DangerLevels } from "@/lib/danger-levels";
import { sensors } from "@/lib/sensors.js";
import type { SummaryCounts } from "@/lib/time-bucket-types";
import { capitalize, cn, getEmoji } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/ui/card";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { SensorIcon } from "./sensor-icon.js";

type ExposureType = Sensor | "all";

type SummaryProps = {
	exposureType: ExposureType;
	view: View;
	data: SummaryCounts;
	mode?: "count" | "sensor";
};

type SummaryLabel = Record<DangerLevel, string>;

export function Summary({ exposureType, data, mode = "count" }: SummaryProps) {
	const { t, i18n } = useTranslation();
	const { view } = useView();
	const isMobile = useIsMobile();
	const formatDate = useFormatDate();

	const safeColor = "text-safe";
	const warningColor = "text-warning";
	const dangerColor = "text-danger";

	const defaultLabels: SummaryLabel = {
		safe: "SAFE",
		warning: "WARNING",
		danger: "DANGER",
	};

	const viewLabelConfig: Record<View, SummaryLabel> = {
		day: {
			safe: t(($) => $.exposureSummary.greenText),
			warning: t(($) => $.exposureSummary.orangeText),
			danger: t(($) => $.exposureSummary.redText),
		},
		week: {
			safe: t(($) => $.exposureSummary.greenHourText),
			warning: t(($) => $.exposureSummary.orangeHourText),
			danger: t(($) => $.exposureSummary.redHourText),
		},
		month: {
			safe: t(($) => $.exposureSummary.greenDayText),
			warning: t(($) => $.exposureSummary.orangeDayText),
			danger: t(($) => $.exposureSummary.redDayText),
		},
	};

	// For vibration in day view we show summary as hours
	const labelView = exposureType === "vibration" && view === "day" ? "week" : view;

	const summaryLabels = {
		exposureType: exposureType === "all" ? "Every sensor" : exposureType,
		safeLabel: viewLabelConfig[labelView].safe || defaultLabels.safe,
		warningLabel: viewLabelConfig[labelView].warning || defaultLabels.warning,
		dangerLabel: viewLabelConfig[labelView].danger || defaultLabels.danger,
	};

	const currentDate = useDate().date;
	// For specific sensor: "<Sensor> exposure for <...>"
	// For all sensors: "Exposure for <...>"
	let summaryTitle = exposureType === "all" ? "" : `${t(($) => $.sensors[exposureType])} `;

	if (view === "month") {
		summaryTitle += t(($) => $.exposureSummary.title.month, {
			month: formatDate(currentDate, "MMMM"),
		});
	} else if (view === "week") {
		summaryTitle += t(($) => $.exposureSummary.title.week, {
			week: formatDate(currentDate, "w"),
		});
	} else {
		summaryTitle += t(($) => $.exposureSummary.title.day, {
			day: formatDate(currentDate, i18n.language === "en" ? "MMMM do, yyyy" : "dd. MMMM yyyy"),
		});
	}

	if (exposureType !== "all") {
		summaryTitle = capitalize(summaryTitle);
	}

	let content: ReactNode;

	if (mode === "count") {
		content = (
			<CardContent className="grid grid-cols-[auto_1fr] items-center gap-2">
				<p className={cn("text-right font-bold md:text-center", safeColor)}>
					{getSensorValueString(data.safeCount, view, exposureType)}
				</p>
				<p className={cn("text-xs md:text-sm", safeColor)}>
					{isMobile ? defaultLabels.safe : summaryLabels.safeLabel}
				</p>

				<p className={cn("text-right font-bold md:text-center", warningColor)}>
					{getSensorValueString(data.warningCount, view, exposureType)}
				</p>
				<p className={cn("text-xs md:text-sm", warningColor)}>
					{isMobile ? defaultLabels.warning : summaryLabels.warningLabel}
				</p>

				<p className={cn("text-right font-bold md:text-center", dangerColor)}>
					{getSensorValueString(data.dangerCount, view, exposureType)}
				</p>
				<p className={cn("text-xs md:text-sm", dangerColor)}>
					{isMobile ? defaultLabels.danger : summaryLabels.dangerLabel}
				</p>
			</CardContent>
		);
	} else {
		content = (
			<CardContent className="gap-5">
				{sensors.map((sensor) => {
					const sensorSummary = data.bySensor[sensor];

					const highestLevel = getHighestLevel(sensorSummary);

					const color = highestLevel === null ? undefined : `var(--${DangerLevels[highestLevel].color})`;

					const description = t(($) =>
						highestLevel ? $.exposureSummary[`${highestLevel}Smiley` as const] : $.exposureSummary.noData,
					);

					const label = t(($) => $.sensors[sensor]);
					const Emoji = getEmoji(highestLevel);

					return (
						<div key={sensor} className="flex items-center justify-between">
							<div className="flex min-w-0 grow items-center gap-3">
								<SensorIcon
									type={sensor}
									size="sm"
									dangerLevel={highestLevel ?? undefined}
									className="shrink-0"
								/>

								<div className="flex min-w-0 grow flex-col">
									<p className="truncate text-foreground text-sm" title={label}>
										{label}
									</p>

									<p className="truncate text-xs" style={{ color }} title={description}>
										{description}
									</p>
								</div>
							</div>

							<div className="w-fit">
								<Emoji size="1.25rem" style={{ color }} />
							</div>
						</div>
					);
				})}
			</CardContent>
		);
	}

	return (
		<Card muted={true} className="w-full gap-0 p-5">
			<CardHeader>
				<h2 className="text-muted-foreground text-xs uppercase tracking-wider">{summaryTitle}</h2>
			</CardHeader>

			<CardContent className="gap-5">{content}</CardContent>
		</Card>
	);
}

function getSensorValueString(value: number, view: View, exposureType: ExposureType) {
	if (view === "day" && exposureType !== "vibration") {
		const hours = Math.floor(value / 60);
		const minutes = value % 60;

		if (hours === 0) {
			return `${minutes}m`;
		}

		if (minutes === 0) {
			return `${hours}h`;
		}

		return `${hours}h ${minutes}m`;
	}

	return value % 1 === 0 ? `${Math.floor(value)}` : value.toFixed(1);
}

function getHighestLevel({
	dangerCount,
	warningCount,
	safeCount,
}: {
	dangerCount: number;
	warningCount: number;
	safeCount: number;
}) {
	if (dangerCount > 0) {
		return "danger";
	}

	if (warningCount > 0) {
		return "warning";
	}

	if (safeCount > 0) {
		return "safe";
	}

	return null;
}
