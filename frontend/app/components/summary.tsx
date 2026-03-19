import type { Sensor } from "@/features/sensor-picker/sensors";
import { useView } from "@/features/views/use-view";
import type { View } from "@/features/views/views";
import { useIsMobile } from "@/hooks/use-mobile";
import { type DangerLevel, DangerLevels } from "@/lib/danger-levels";
import type { SummaryCounts, TimeBucketStatus } from "@/lib/time-bucket-types";
import { cn } from "@/lib/utils";
import { Card } from "@/ui/card";
import { Frown, Meh, Smile } from "lucide-react";
import { useTranslation } from "react-i18next";

type ExposureType = Sensor | "all";

type SummaryProps = {
	exposureType: ExposureType;
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
	const { t } = useTranslation();
	const { view } = useView();

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
	const isMobile = useIsMobile();

	return (
		<Card className="w-full gap-0 p-5">
			<div className="border-b-2 border-b-slate-300 md:pb-2 md:pl-2">
				<h2 className="text-center text-xl md:text-left md:text-2xl">
					{t(($) => $.exposure_summary.title)}
				</h2>
			</div>
			<div className="exposure-subheader">
				<h4 className="text-center text-slate-400 text-sm md:text-right">
					<span>
						{exposureType
							? t(($) => $.exposure_summary[exposureType])
							: t(($) => $.exposure_summary.allSensors)}
					</span>
				</h4>
			</div>
			{mode === "sensor" ? (
				<div className="mt-4 flex flex-col gap-4">
					{Object.entries(
						getSensorSummaryFromOverview(sensorData ?? []),
					).map(([sensor, level]) => {
						const color = `text-${DangerLevels[level].color}`;
						const label = t(
							($) =>
								$.exposure_summary[`${level}Smiley` as const],
						);

						const emoji =
							level === "danger" ? (
								<Frown />
							) : level === "warning" ? (
								<Meh />
							) : (
								<Smile />
							);

						return (
							<div
								key={sensor}
								className="grid grid-cols-[1fr_140px] items-center"
							>
								<div className="capitalize">
									{t(
										($) =>
											$.exposure_summary[
												sensor as Sensor
											],
									)}
								</div>

								<div
									className={cn(
										"grid grid-cols-[20px_1fr] items-center gap-1 justify-self-end text-xs md:text-sm",
										color,
									)}
								>
									<span className="flex justify-center">
										{emoji}
									</span>
									<span>{label}</span>
								</div>
							</div>
						);
					})}
				</div>
			) : (
				<div className="exposures-wrapper flex flex-row justify-center gap-4 md:flex-col md:gap-0">
					<SummaryRow
						count={data.safeCount}
						label={
							isMobile
								? defaultLabels.safe
								: summaryLabels.safeLabel
						}
						hoverTitle={DangerLevels.safe.label}
						colorClass={safeColor}
					/>
					<SummaryRow
						count={data.warningCount}
						label={
							isMobile
								? defaultLabels.warning
								: summaryLabels.warningLabel
						}
						hoverTitle={DangerLevels.warning.label}
						colorClass={warningColor}
					/>
					<SummaryRow
						count={data.dangerCount}
						label={
							isMobile
								? defaultLabels.danger
								: summaryLabels.dangerLabel
						}
						hoverTitle={DangerLevels.danger.label}
						colorClass={dangerColor}
					/>
				</div>
			)}
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
		<p className={cn("ml-1 text-xs md:ml-2 md:text-sm", colorClass)}>
			{label}
		</p>
	</div>
);

function getSensorSummaryFromOverview(
	buckets: Array<TimeBucketStatus>,
): Record<Sensor, DangerLevel> {
	const result: Record<Sensor, DangerLevel> = {
		dust: "safe",
		noise: "safe",
		vibration: "safe",
	};

	for (const bucket of buckets) {
		const sensors = bucket.sensorDangerLevels;

		if (!sensors) continue;

		(Object.keys(result) as Array<Sensor>).forEach((sensor) => {
			const level = sensors[sensor];

			if (!level) return;

			if (level === "danger") {
				result[sensor] = "danger";
			} else if (level === "warning" && result[sensor] === "safe") {
				result[sensor] = "warning";
			}
		});
	}

	return result;
}
