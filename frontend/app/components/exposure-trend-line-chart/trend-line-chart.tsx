import { ChartContainer } from "@/components/ui/chart";
import { useFormatDate } from "@/hooks/use-format-date";
import { DangerLevels } from "@/lib/danger-levels";
import type { ExposureDto, ExposureTypeField } from "@/lib/dto";
import type { Exposure, ExposureUnit } from "@/lib/exposures";
import { getThreshold } from "@/lib/thresholds";
import { buildYAxisTicks, cn, DUST_Y_AXIS_STEP, formatExposureValue } from "@/lib/utils";
import { addDays, addWeeks, endOfMonth, endOfWeek, getISOWeek, startOfDay, startOfMonth, startOfWeek } from "date-fns";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { CartesianGrid, Legend, Line, LineChart, XAxis, YAxis } from "recharts";
import type { CurveType } from "recharts/types/shape/Curve";
import { ExposureDot } from "../exposure-line-chart/exposure-dot";
import { ExposureLegend } from "../exposure-line-chart/exposure-legend";
import { ExposureLineChartGradientStops } from "../exposure-line-chart/exposure-line-chart-gradient-stops";
import { ThresholdLegend } from "../exposure-line-chart/threshold-legend";
import { ThresholdLine } from "../exposure-line-chart/threshold-line";
import { ExposureTrendTooltip } from "./exposure-trend-tooltip";

type TrendGranularity = "day" | "week";

const Y_AXIS_WIDTH = 60;

export type TrendSeries = {
	exposure: Exposure;
	exposureField?: ExposureTypeField;
	data: Array<ExposureDto>;
};

export interface TrendLineChartProps {
	series: Array<TrendSeries>;
	selectedDate: Date;
	unit: ExposureUnit;
	minY: number;
	maxY: number;
	granularity: TrendGranularity;
	lineType?: CurveType;
	chartContainerClassName?: string;
	usePeakDangerThreshold?: boolean;
}

export type SeriesDefinition = {
	exposure: Exposure;
	exposureField?: ExposureTypeField;
	dataKey: string;
	label: string;
	valuesByBucket: Map<string, number>;
};

export function TrendLineChart({
	series,
	selectedDate,
	unit,
	minY,
	maxY,
	granularity,
	lineType = "linear",
	chartContainerClassName,
	usePeakDangerThreshold = false,
}: TrendLineChartProps) {
	const { t } = useTranslation();
	const formatDate = useFormatDate();
	const gradientId = useId();

	const bucketDates = getBucketDates(selectedDate, granularity);
	const seriesDefinitions = buildSeriesDefinitions(series, granularity, t);
	const chartData = buildChartData(bucketDates, seriesDefinitions, granularity, formatDate, t);

	const [hoveredSeriesKey, setHoveredSeriesKey] = useState<string | null>(null);
	const isDustChart = series.every((serie) => serie.exposure === "dust");
	const yTicks = isDustChart ? buildYAxisTicks(minY, maxY, DUST_Y_AXIS_STEP) : undefined;
	const defaultFractionDigits = isDustChart ? 1 : 0;
	const fractionDigitsPerUnit = isDustChart ? { mg: 4 } : { mg: 3 };

	const isSingleSeries = seriesDefinitions.length === 1;

	// If we only have 1 series, we always show the thresholds for that series, otherwise we only show the thresholds for the hovered series
	const activeSeriesKey = isSingleSeries ? (seriesDefinitions[0]?.dataKey ?? null) : hoveredSeriesKey;

	const activeSeries = seriesDefinitions.find((serie) => serie.dataKey === activeSeriesKey) ?? null;

	const thresholdLines = activeSeries ? getThresholdLines(activeSeries, usePeakDangerThreshold) : [];

	const singleSeries = isSingleSeries ? (seriesDefinitions[0] ?? null) : null;

	let singleSeriesThreshold: ReturnType<typeof getThreshold> | null = null;
	let singleSeriesDangerThreshold: number | null = null;
	let singleSeriesWarningThreshold = 0;
	let singleSeriesValues: Array<number> = [];

	if (singleSeries) {
		singleSeriesThreshold = getThreshold(singleSeries.exposure, singleSeries.exposureField);

		singleSeriesDangerThreshold = usePeakDangerThreshold
			? singleSeriesThreshold.peakDanger
			: singleSeriesThreshold.danger;

		singleSeriesWarningThreshold = singleSeriesThreshold.warning;

		singleSeriesValues = Array.from(singleSeries.valuesByBucket.values());
	}

	const dataBucketCount = chartData.filter((row) =>
		seriesDefinitions.some((serie) => row[serie.dataKey] != null),
	).length;

	const showDot = dataBucketCount === 1;

	return (
		<ChartContainer config={{}} className={cn("h-full w-full", chartContainerClassName)}>
			<LineChart accessibilityLayer={true} data={chartData} margin={{ left: 12, right: 12 }}>
				<CartesianGrid vertical={true} strokeDasharray="3 3" />

				<XAxis
					dataKey="label"
					tickLine={false}
					axisLine={false}
					tickMargin={8}
					tick={{
						className: "text-sm",
						fill: "var(--color-muted-foreground)",
					}}
				/>

				<YAxis
					width={Y_AXIS_WIDTH}
					tickLine={false}
					axisLine={false}
					tick={{
						className: "text-base",
						fill: "var(--color-muted-foreground)",
					}}
					domain={[minY, maxY]}
					ticks={yTicks}
					tickFormatter={(value) =>
						formatExposureValue(value, unit, defaultFractionDigits, fractionDigitsPerUnit)
					}
					label={{
						value: t(($) => $.exposures.units[unit]),
						position: "inside",
						dx: -32,
						angle: -90,
						className: "text-lg mr-4",
						fill: "var(--color-muted-foreground)",
					}}
				/>

				<ExposureTrendTooltip unit={unit} seriesDefinitions={seriesDefinitions} />

				{isSingleSeries && singleSeriesThreshold && singleSeriesDangerThreshold && (
					<defs>
						<linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
							<ExposureLineChartGradientStops
								values={singleSeriesValues}
								warningThreshold={singleSeriesWarningThreshold}
								dangerThreshold={singleSeriesDangerThreshold}
								usePeakData={usePeakDangerThreshold}
							/>
						</linearGradient>
					</defs>
				)}

				{seriesDefinitions.map((serie) => (
					<Line
						key={serie.dataKey}
						name={serie.label}
						dataKey={serie.dataKey}
						type={lineType}
						stroke={isSingleSeries ? `url(#${gradientId})` : getDustFieldColor(serie.exposureField)}
						strokeWidth={3}
						isAnimationActive={false}
						connectNulls={true}
						onMouseEnter={() => setHoveredSeriesKey(serie.dataKey)}
						onMouseLeave={() => setHoveredSeriesKey(null)}
						opacity={hoveredSeriesKey !== null && hoveredSeriesKey !== serie.dataKey ? 0.5 : 1}
						dot={showDot}
						activeDot={
							isSingleSeries && singleSeriesDangerThreshold !== null
								? (props) => (
										<ExposureDot
											{...props}
											warning={singleSeriesWarningThreshold}
											danger={singleSeriesDangerThreshold}
											isPeak={usePeakDangerThreshold}
										/>
									)
								: {
										r: 5,
										fill: getDustFieldColor(serie.exposureField),
										stroke: "none",
									}
						}
					/>
				))}
				{thresholdLines.map((line) => (
					<ThresholdLine key={line.key} y={line.y} dangerLevel={line.dangerLevel} />
				))}

				<Legend
					content={() => (
						<div className="mt-2 flex flex-col gap-3" style={{ marginLeft: Y_AXIS_WIDTH }}>
							{/* Only show exposure legend if there are multiple exposures or fields */}
							{!isSingleSeries && (
								<ExposureLegend
									items={seriesDefinitions.map((serie) => ({
										label: getSeriesLabel(serie.exposure, serie.exposureField, t),
										color: getDustFieldColor(serie.exposureField),
									}))}
								/>
							)}
							<ThresholdLegend
								items={[
									{
										dangerLevel: "danger",
										color: `var(--${DangerLevels.danger.color})`,
									},
									{
										dangerLevel: "warning",
										color: `var(--${DangerLevels.warning.color})`,
									},
								]}
							/>
						</div>
					)}
				/>
			</LineChart>
		</ChartContainer>
	);
}

function getThresholdLines(
	serie: SeriesDefinition,
	usePeakDangerThreshold: boolean,
): Array<{ key: string; y: number; dangerLevel: "warning" | "danger" }> {
	const threshold = getThreshold(serie.exposure, serie.exposureField);
	const lines: Array<{
		key: string;
		y: number;
		dangerLevel: "warning" | "danger";
	}> = [];

	if (threshold.peakDanger && usePeakDangerThreshold) {
		lines.push({
			key: `${serie.dataKey}-danger`,
			y: threshold.peakDanger,
			dangerLevel: "danger",
		});
		return lines;
	}

	if (threshold.warning) {
		lines.push({
			key: `${serie.dataKey}-warning`,
			y: threshold.warning,
			dangerLevel: "warning",
		});
	}

	if (threshold.danger) {
		lines.push({
			key: `${serie.dataKey}-danger`,
			y: threshold.danger,
			dangerLevel: "danger",
		});
	}

	return lines;
}

function buildSeriesDefinitions(
	series: Array<TrendSeries>,
	granularity: TrendGranularity,
	t: ReturnType<typeof useTranslation>["t"],
): Array<SeriesDefinition> {
	return series.map((serie) => ({
		exposure: serie.exposure,
		exposureField: serie.exposureField,
		dataKey: getSeriesDataKey(serie.exposure, serie.exposureField),
		label: getSeriesLabel(serie.exposure, serie.exposureField, t),
		valuesByBucket: new Map(serie.data.map((item) => [normalizeBucketKey(item.time, granularity), item.value])),
	}));
}

function buildChartData(
	bucketDates: Array<Date>,
	seriesDefinitions: Array<SeriesDefinition>,
	granularity: TrendGranularity,
	formatDate: ReturnType<typeof useFormatDate>,
	t: ReturnType<typeof useTranslation>["t"],
): Array<Record<string, string | number | null>> {
	return bucketDates.map((date) => {
		const bucketKey = normalizeBucketKey(date, granularity);

		const row: Record<string, string | number | null> = {
			bucketKey,
			label: getBucketLabel(date, granularity, t, formatDate),
		};

		for (const serie of seriesDefinitions) {
			row[serie.dataKey] = serie.valuesByBucket.get(bucketKey) ?? null;
		}

		return row;
	});
}

function getBucketLabel(
	date: Date,
	granularity: TrendGranularity,
	t: ReturnType<typeof useTranslation>["t"],
	formatDate: ReturnType<typeof useFormatDate>,
): string {
	if (granularity === "week") {
		return t(($) => $.common.weekNumber, {
			week: getISOWeek(date),
		});
	}

	return formatDate(date, "dd.MM");
}

function getSeriesDataKey(exposure: Exposure, field?: ExposureTypeField): string {
	return field ? `${exposure}:${field}` : exposure;
}

function getSeriesLabel(
	exposure: Exposure,
	field: ExposureTypeField | undefined,
	t: ReturnType<typeof useTranslation>["t"],
): string {
	if (!field) {
		return t(($) => $.exposures[exposure]);
	}

	return t(($) => $.exposures.dustExposureLabels[field]);
}

function getDustFieldColor(field?: ExposureTypeField): string {
	switch (field) {
		case "pm1_twa":
			return "var(--color-green-700)";
		case "pm25_twa":
			return "var(--color-blue-600)";
		case "pm4_twa":
			return "var(--color-orange-400)";
		case "pm10_twa":
			return "var(--color-red-600)";
		default:
			return "var(--color-blue-600)";
	}
}

/**
 * Creates one bucket for every day of the week for granularity week,
 * or every week of the month for granularity month,
 * for the given data.
 */
function getBucketDates(selectedDate: Date, granularity: TrendGranularity): Array<Date> {
	const dates: Array<Date> = [];

	if (granularity === "day") {
		let current = startOfWeek(selectedDate, { weekStartsOn: 1 });
		const end = endOfWeek(selectedDate, { weekStartsOn: 1 });

		while (current <= end) {
			dates.push(current);
			current = addDays(current, 1);
		}

		return dates;
	}

	let current = startOfWeek(startOfMonth(selectedDate), { weekStartsOn: 1 });
	const end = startOfWeek(endOfMonth(selectedDate), { weekStartsOn: 1 });

	while (current <= end) {
		dates.push(current);
		current = addWeeks(current, 1);
	}

	return dates;
}

function normalizeBucketKey(date: Date, granularity: TrendGranularity): string {
	if (granularity === "day") {
		return startOfDay(date).toISOString();
	}

	return startOfWeek(date, { weekStartsOn: 1 }).toISOString();
}
