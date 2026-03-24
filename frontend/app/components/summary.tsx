import {
	CircleDashedIcon,
	Frown,
	FrownIcon,
	Meh,
	MehIcon,
	Smile,
	SmileIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { Sensor } from "@/features/sensor-picker/sensors";
import { useView } from "@/features/views/use-view";
import type { View } from "@/features/views/views";
import { useFormatDate } from "@/hooks/use-format-date.js";
import { useIsMobile } from "@/hooks/use-mobile";
import {
	compareDangerLevels,
	type DangerLevel,
	DangerLevels,
	isHigherSeverity,
} from "@/lib/danger-levels";
import type { SummaryCounts, TimeBucketStatus } from "@/lib/time-bucket-types";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/ui/card";
import { SensorIcon } from "./sensor-icon.js";

type ExposureType = Sensor | "all";

type SummaryProps = {
	exposureType: ExposureType;
	view: View;
	data: SummaryCounts;
	mode?: "count" | "sensor";
	sensorData?: Array<TimeBucketStatus>;
};

type SummaryLabel = Record<DangerLevel, string>;

export function Summary({
	exposureType,
	data,
	mode = "count",
	sensorData,
}: SummaryProps) {
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

	if (view === "month") {
		summaryTitle = t(($) => $.exposure_summary.title.month, {
			month: formatDate(new Date(), "MMMM"),
		});
	} else if (view === "week") {
		summaryTitle = t(($) => $.exposure_summary.title.week, {
			week: formatDate(new Date(), "w"),
		});
	} else {
		summaryTitle = t(($) => $.exposure_summary.title.day, {
			day: formatDate(
				new Date(),
				i18n.language === "en" ? "MMMM do, yyyy" : "dd. MMMM yyyy",
			),
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
				{getSensorSummaryFromOverview(sensorData ?? []).map(
					([sensor, level]) => {
						const color =
							level !== null
								? `var(--${DangerLevels[level].color})`
								: undefined;

						const description = t(($) =>
							level
								? $.exposure_summary[`${level}Smiley` as const]
								: $.exposure_summary.noData,
						);

						const label = t(($) => $[sensor]);
						const Emoji = getEmoji(level);

						return (
							<div key={sensor} className="flex justify-between items-center">
								<div className="flex grow items-center gap-3 min-w-0">
									<SensorIcon
										type={sensor}
										size="sm"
										dangerLevel={level ?? undefined}
										className="shrink-0"
									/>

									<div className="flex flex-col min-w-0 grow">
										<p
											className="text-sm text-foreground truncate"
											title={label}
										>
											{label}
										</p>

										<p
											className="text-xs truncate"
											style={{ color }}
											title={description}
										>
											{description}
										</p>
									</div>
								</div>

								<div className="w-fit">
									<Emoji size="1.25rem" style={{ color }} />
								</div>
							</div>
						);
					},
				)}
			</CardContent>
		);
	}

	return (
		<Card muted className="w-full gap-0 p-5">
			<CardHeader>
				<h2 className="text-muted-foreground text-xs uppercase tracking-wider">
					{summaryTitle}
				</h2>
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

const SummaryRow = ({
	hoverTitle,
	count,
	label,
	colorClass,
}: SummaryRowProps) => (
	<div
		className="flex items-baseline justify-center p-2 md:justify-start"
		title={hoverTitle}
	>
		<p
			className={cn(
				"w-8 text-right font-bold text-2xl brightness-110 md:text-center",
				colorClass,
			)}
		>
			{count}
		</p>
		<p className={cn("ml-1 text-xs md:ml-2 md:text-sm", colorClass)}>{label}</p>
	</div>
);

function getSensorSummaryFromOverview(
	buckets: Array<TimeBucketStatus>,
): [Sensor, DangerLevel | null][] {
	const result: Record<Sensor, DangerLevel | null> = {
		dust: null,
		noise: null,
		vibration: null,
	};

	for (const bucket of buckets) {
		const sensorSeverityLevels = bucket.sensorDangerLevels;

		if (!sensorSeverityLevels) {
			continue;
		}

		(Object.keys(result) as Array<Sensor>).forEach((currentSensor) => {
			const currentSeverity = result[currentSensor];
			const newSeverity = sensorSeverityLevels[currentSensor];

			if (newSeverity == null) {
				return;
			}

			const isNewMoreSevere = isHigherSeverity(currentSeverity, newSeverity);

			if (isNewMoreSevere) {
				result[currentSensor] = newSeverity;
			}
		});
	}

	return Object.entries(result) as [Sensor, DangerLevel | null][];
}

function getEmoji(dangerLevel: DangerLevel | null) {
	if (dangerLevel === "danger") {
		return FrownIcon;
	}

	if (dangerLevel === "warning") {
		return MehIcon;
	}

	if (dangerLevel === "safe") {
		return SmileIcon;
	}

	return CircleDashedIcon;
}
