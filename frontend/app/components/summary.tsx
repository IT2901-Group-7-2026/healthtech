import { useDate } from "@/features/date-picker/use-date.js";
import type { Sensor } from "@/features/sensor-picker/sensors";
import { useView } from "@/features/views/use-view";
import type { View } from "@/features/views/views";
import { useFormatDate } from "@/hooks/use-format-date.js";
import { useIsMobile } from "@/hooks/use-mobile";
import { type DangerLevel, DangerLevels } from "@/lib/danger-levels";
import { sensors } from "@/lib/sensors.js";
import type { SummaryCounts } from "@/lib/time-bucket-types";
import { cn, getEmoji } from "@/lib/utils";
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

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: bruh
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
			safe: t(($) => $.exposure_summary.greenHourText),
			warning: t(($) => $.exposure_summary.orangeHourText),
			danger: t(($) => $.exposure_summary.redHourText),
		},
		week: {
			safe: t(($) => $.exposure_summary.greenHourText),
			warning: t(($) => $.exposure_summary.orangeHourText),
			danger: t(($) => $.exposure_summary.redHourText),
		},
		month: {
			safe: t(($) => $.exposure_summary.greenDayText),
			warning: t(($) => $.exposure_summary.orangeDayText),
			danger: t(($) => $.exposure_summary.redDayText),
		},
	};

	const summaryLabels = {
		exposureType: exposureType === "all" ? "Every sensor" : exposureType,
		safeLabel: viewLabelConfig[view].safe || defaultLabels.safe,
		warningLabel: viewLabelConfig[view].warning || defaultLabels.warning,
		dangerLabel: viewLabelConfig[view].danger || defaultLabels.danger,
	};

	let summaryTitle = "";
	const currentDate = useDate().date;

	if (view === "month") {
		summaryTitle = t(($) => $.exposure_summary.title.month, {
			month: formatDate(currentDate, "MMMM"),
		});
	} else if (view === "week") {
		summaryTitle = t(($) => $.exposure_summary.title.week, {
			week: formatDate(currentDate, "w"),
		});
	} else {
		summaryTitle = t(($) => $.exposure_summary.title.day, {
			day: formatDate(currentDate, i18n.language === "en" ? "MMMM do, yyyy" : "dd. MMMM yyyy"),
		});
	}

	let content: ReactNode;

	if (mode === "count") {
		content = (
			<CardContent className="exposures-wrapper flex flex-row justify-center gap-4 md:flex-col md:gap-0">
				<SummaryRow
					count={data.safeCount}
					label={isMobile ? defaultLabels.safe : summaryLabels.safeLabel}
					hoverTitle={DangerLevels.safe.label}
					colorClass={safeColor}
				/>
				<SummaryRow
					count={data.warningCount}
					label={isMobile ? defaultLabels.warning : summaryLabels.warningLabel}
					hoverTitle={DangerLevels.warning.label}
					colorClass={warningColor}
				/>
				<SummaryRow
					count={data.dangerCount}
					label={isMobile ? defaultLabels.danger : summaryLabels.dangerLabel}
					hoverTitle={DangerLevels.danger.label}
					colorClass={dangerColor}
				/>
			</CardContent>
		);
	} else {
		content = (
			<CardContent className="gap-5">
				{sensors.map((sensor) => {
					const sensorSummary = data.bySensor[sensor];

					const highestLevel = getHighestLevel(sensorSummary);

					const color = highestLevel !== null ? `var(--${DangerLevels[highestLevel].color})` : undefined;

					const description = t(($) =>
						highestLevel ? $.exposure_summary[`${highestLevel}Smiley` as const] : $.exposure_summary.noData,
					);

					const label = t(($) => $[sensor]);
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

interface SummaryRowProps {
	count: number;
	label: string;
	hoverTitle: string;
	colorClass: string;
}

const SummaryRow = ({ hoverTitle, count, label, colorClass }: SummaryRowProps) => (
	<div className="flex items-baseline justify-center p-2 md:justify-start" title={hoverTitle}>
		<p className={cn("w-8 text-right font-bold text-2xl brightness-110 md:text-center", colorClass)}>{count}</p>
		<p className={cn("ml-1 text-xs md:ml-2 md:text-sm", colorClass)}>{label}</p>
	</div>
);

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
