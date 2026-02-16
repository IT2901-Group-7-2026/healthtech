import type { Sensor } from "@/features/sensor-picker/sensors";
import { useView } from "@/features/views/use-view";
import type { View } from "@/features/views/views";
import { useIsMobile } from "@/hooks/use-mobile";
import { type DangerLevel, DangerLevels } from "@/lib/danger-levels";
import type { AllSensors, SensorDataResponseDto } from "@/lib/dto";
import { cn } from "@/lib/utils";
import { Card } from "@/ui/card";
import { useTranslation } from "react-i18next";

type ExposureType = Sensor | "all";

type SummaryProps = {
	exposureType: ExposureType;
	data: Array<SensorDataResponseDto> | AllSensors | undefined;
};

type SummaryLabel = Record<DangerLevel, string>;

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
	const summaryData: SummaryType = getSummaryData({
		view,
		exposureType,
		data,
	});

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
					title={DangerLevels.safe.label}
				>
					<span
						className={cn(
							"w-8 text-right font-bold text-2xl brightness-110 md:text-center",
							safeColor,
						)}
					>
						{summaryData.safeCount}
					</span>
					<span
						className={cn(
							"ml-1 text-xs md:ml-2 md:text-sm",
							safeColor,
						)}
					>
						{isMobile
							? defaultLabels.safe
							: summaryLabels.safeLabel}
					</span>
				</div>
				{/* Warning */}
				<div
					className="flex items-baseline justify-center p-2 md:justify-start"
					title={DangerLevels.warning.label}
				>
					<span
						className={cn(
							"w-8 text-right font-bold text-2xl brightness-110 md:text-center",
							warningColor,
						)}
					>
						{summaryData.warningCount}
					</span>
					<span
						className={cn(
							"ml-1 text-xs md:ml-2 md:text-sm",
							warningColor,
						)}
					>
						{isMobile
							? defaultLabels.warning
							: summaryLabels.warningLabel}
					</span>
				</div>
				{/* Danger */}
				<div
					className="flex items-baseline justify-center p-2 md:justify-start"
					title={DangerLevels.danger.label}
				>
					<span
						className={cn(
							"w-8 text-right font-bold text-2xl brightness-110 md:text-center",
							dangerColor,
						)}
					>
						{summaryData.dangerCount}
					</span>
					<span
						className={cn(
							"ml-1 text-xs md:ml-2 md:text-sm",
							dangerColor,
						)}
					>
						{isMobile
							? defaultLabels.danger
							: summaryLabels.dangerLabel}
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
	exposureType: ExposureType,
	data: Array<SensorDataResponseDto>,
): SummaryType => {
	const summaryData = {
		safeCount: data.filter((d) => d.dangerLevel === "safe").length,
		dangerCount: data.filter((d) => d.dangerLevel === "danger").length,
		warningCount: data.filter((d) => d.dangerLevel === "warning").length,
	};

	// In the 'all' type we use hour granularity instead of minute granularity for the day view, so we don't need to adjust here TODO: This override is a bit messy
	//TODO: This calculation doesn't work because it assumes perfect data with one entry per minute - related to issue #HLTH-11
	if (view === "day" && exposureType !== "all") {
		summaryData.dangerCount = Math.ceil(summaryData.dangerCount / 60);
		summaryData.warningCount = Math.round(summaryData.warningCount / 60);
		summaryData.safeCount = Math.floor(summaryData.safeCount / 60);
	}

	return summaryData;
};

// TODO: Rewrite this method
const getSummaryForAll = (view: View, data: AllSensors): SummaryType => {
	if (view === "day") {
		let allData = Object.entries(data)
			.map(
				([, sensorData]) =>
					data &&
					getSingleSummary(view, "all", sensorData.data ?? []),
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
		if (!allData)
			allData = { safeCount: 0, dangerCount: 0, warningCount: 0 };
		return allData;
	}

	//TODO: This will always be a bit wrong because we only show hours 8-16 in the calendar but have more data than that. also we should only remove time duplicates if we're not on day view as that's the only time we show all three sensors at once

	const timePeriodDangerLevels = new Map<string, DangerLevel>();

	Object.entries(data).forEach(([, sensorData]) => {
		(sensorData.data ?? []).forEach((item) => {
			const timeKey = item.time.toISOString();
			const existingLevel = timePeriodDangerLevels.get(timeKey);

			// Keep the worst danger level for each time period
			if (
				!existingLevel ||
				item.dangerLevel === "danger" ||
				(item.dangerLevel === "warning" && existingLevel === "safe")
			) {
				timePeriodDangerLevels.set(timeKey, item.dangerLevel);
			}
		});
	});

	const summaryData = {
		safeCount: 0,
		warningCount: 0,
		dangerCount: 0,
	};

	timePeriodDangerLevels.forEach((level) => {
		if (level === "safe") summaryData.safeCount++;
		else if (level === "warning") summaryData.warningCount++;
		else if (level === "danger") summaryData.dangerCount++;
	});

	return summaryData;
};
