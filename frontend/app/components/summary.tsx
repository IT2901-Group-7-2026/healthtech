import type { Sensor } from "@/features/sensor-picker/sensors";
import { useView } from "@/features/views/use-view";
import type { View } from "@/features/views/views";
import { useIsMobile } from "@/hooks/use-mobile";
import { type DangerKey, dangerLevels } from "@/lib/danger-levels";
import type { AllSensors, SensorDataResponseDto } from "@/lib/dto";
import { thresholds } from "@/lib/thresholds";
import { cn } from "@/lib/utils";
import { Card } from "@/ui/card";
import { useTranslation } from "react-i18next";

type SummaryProps = {
	exposureType: Sensor | "all";
	data: Array<SensorDataResponseDto> | AllSensors | undefined;
};

type SummaryLabel = Record<DangerKey, string>;

export function Summary({ exposureType, data }: SummaryProps) {
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
	const summaryData: SummaryType = getSummaryData({ view, exposureType, data });

	const summaryLabels = {
		exposureType: exposureType === "all" ? "Every sensor" : exposureType,
		safeLabel: viewLabelConfig[view].safe || defaultLabels.safe,
		warningLabel: viewLabelConfig[view].warning || defaultLabels.warning,
		dangerLabel: viewLabelConfig[view].danger || defaultLabels.danger,
	};
	const isMobile = useIsMobile();

	return (
		<Card className="flex w-full flex-col gap-0 p-5 shadow">
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
			<div className="exposures-wrapper flex flex-row justify-center gap-4 md:flex-col md:gap-0">
				{/* Safe */}
				<div
					className="flex items-baseline justify-center p-2 md:justify-start"
					title={dangerLevels.safe.label}
				>
					<span
						className={cn(
							"w-8 text-right font-bold text-2xl brightness-110 md:text-center",
							safeColor,
						)}
					>
						{summaryData.safeCount}
					</span>
					<span className={cn("ml-1 text-xs md:ml-2 md:text-sm", safeColor)}>
						{isMobile ? defaultLabels.safe : summaryLabels.safeLabel}
					</span>
				</div>
				{/* Warning */}
				<div
					className="flex items-baseline justify-center p-2 md:justify-start"
					title={dangerLevels.warning.label}
				>
					<span
						className={cn(
							"w-8 text-right font-bold text-2xl brightness-110 md:text-center",
							warningColor,
						)}
					>
						{summaryData.warningCount}
					</span>
					<span className={cn("ml-1 text-xs md:ml-2 md:text-sm", warningColor)}>
						{isMobile ? defaultLabels.warning : summaryLabels.warningLabel}
					</span>
				</div>
				{/* Danger */}
				<div
					className="flex items-baseline justify-center p-2 md:justify-start"
					title={dangerLevels.danger.label}
				>
					<span
						className={cn(
							"w-8 text-right font-bold text-2xl brightness-110 md:text-center",
							dangerColor,
						)}
					>
						{summaryData.dangerCount}
					</span>
					<span className={cn("ml-1 text-xs md:ml-2 md:text-sm", dangerColor)}>
						{isMobile ? defaultLabels.danger : summaryLabels.dangerLabel}
					</span>
				</div>
			</div>
		</Card>
	);
}

function getSummaryData({
	view,
	exposureType,
	data,
}: SummaryProps & { view: View }): SummaryType {
	let summaryData: SummaryType;
	if (exposureType === "all")
		summaryData = getSummaryForAll(view, (data as AllSensors) ?? []);
	else {
		summaryData = getSingleSummary(
			view,
			exposureType,
			(data as Array<SensorDataResponseDto>) ?? [],
		);
	}
	return summaryData;
}

type SummaryType = {
	safeCount: number;
	dangerCount: number;
	warningCount: number;
};

const getSingleSummary = (
	view: View,
	sensor: Sensor,
	data: Array<SensorDataResponseDto>,
): SummaryType => {
	const summaryData = { safeCount: 0, dangerCount: 0, warningCount: 0 };

	const threshold = thresholds[sensor];

	for (const item of data) {
		if (item.value < threshold.warning) {
			summaryData.safeCount++;
		} else if (item.value < threshold.danger) {
			summaryData.warningCount++;
		} else {
			summaryData.dangerCount++;
		}
	}

	if (view === "day") {
		summaryData.dangerCount = Math.ceil(summaryData.dangerCount / 60);
		summaryData.warningCount = Math.round(summaryData.warningCount / 60);
		summaryData.safeCount = Math.floor(summaryData.safeCount / 60);
	}

	return summaryData;
};

const getSummaryForAll = (view: View, data: AllSensors): SummaryType => {
	let allData = Object.entries(data)
		.map(
			([sensor, sensorData]) =>
				data && getSingleSummary(view, sensor as Sensor, sensorData.data ?? []),
		)
		.reduce(
			(acc: SummaryType, curr) => {
				if (!curr) return acc;
				acc.safeCount += curr.safeCount;
				acc.dangerCount += curr.dangerCount;
				acc.warningCount += curr.warningCount;
				return acc;
			},
			{ safeCount: 0, dangerCount: 0, warningCount: 0 },
		);
	if (!allData) allData = { safeCount: 0, dangerCount: 0, warningCount: 0 };
	return allData;
};
