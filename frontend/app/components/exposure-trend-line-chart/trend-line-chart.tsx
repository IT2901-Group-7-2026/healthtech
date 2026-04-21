import { ChartContainer } from "@/components/ui/chart";
import { useFormatDate } from "@/hooks/use-format-date";
import { DangerLevels } from "@/lib/danger-levels";
import type { SensorDto, SensorTypeField } from "@/lib/dto";
import type { Sensor, SensorUnit } from "@/lib/sensors";
import { getThreshold } from "@/lib/thresholds";
import { cn, formatSensorValue } from "@/lib/utils";
import { addDays, addWeeks, endOfMonth, endOfWeek, getISOWeek, startOfDay, startOfMonth, startOfWeek } from "date-fns";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CartesianGrid, Legend, Line, LineChart, XAxis, YAxis } from "recharts";
import type { CurveType } from "recharts/types/shape/Curve";
import { SensorLegend } from "../exposure-line-chart/sensor-legend";
import { ThresholdLegend } from "../exposure-line-chart/threshold-legend";
import { ThresholdLine } from "../exposure-line-chart/threshold-line";
import { ExposureTrendTooltip } from "./exposure-trend-tooltip";

type TrendGranularity = "day" | "week";

const Y_AXIS_WIDTH = 60;

export type TrendSeries = {
	sensor: Sensor;
	sensorField?: SensorTypeField;
	data: Array<SensorDto>;
};

export interface TrendLineChartProps {
	series: Array<TrendSeries>;
	selectedDate: Date;
	unit: SensorUnit;
	minY: number;
	maxY: number;
	granularity: TrendGranularity;
	lineType?: CurveType;
	chartContainerClassName?: string;
	usePeakDangerThreshold?: boolean;
}

export type SeriesDefinition = {
	sensor: Sensor;
	sensorField?: SensorTypeField;
	dataKey: string;
	label: string;
	color: string;
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

	const bucketDates = getBucketDates(selectedDate, granularity);
	const seriesDefinitions = buildSeriesDefinitions(series, granularity, t);
	const chartData = buildChartData(bucketDates, seriesDefinitions, granularity, formatDate, t);

	const [hoveredSeriesKey, setHoveredSeriesKey] = useState<string | null>(null);

	const isSingleSeries = seriesDefinitions.length === 1;

	// If we only have 1 series, we always show the thresholds for that series, otherwise we only show the thresholds for the hovered series
	const activeSeriesKey = isSingleSeries ? (seriesDefinitions[0]?.dataKey ?? null) : hoveredSeriesKey;

	const activeSeries = seriesDefinitions.find((serie) => serie.dataKey === activeSeriesKey) ?? null;

	const thresholdLines = activeSeries ? getThresholdLines(activeSeries, usePeakDangerThreshold) : [];

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
					tickFormatter={(value) => formatSensorValue(value, unit, 0, { mg: 3 })}
					label={{
						value: t(($) => $.sensors.units[unit]),
						position: "inside",
						dx: -32,
						angle: -90,
						className: "text-lg mr-4",
						fill: "var(--color-muted-foreground)",
					}}
				/>

				<ExposureTrendTooltip unit={unit} seriesDefinitions={seriesDefinitions} />

				{seriesDefinitions.map((serie) => (
					<Line
						key={serie.dataKey}
						name={serie.label}
						dataKey={serie.dataKey}
						type={lineType}
						stroke={serie.color}
						strokeWidth="3"
						isAnimationActive={false}
						connectNulls={true}
						onMouseEnter={() => setHoveredSeriesKey(serie.dataKey)}
						onMouseLeave={() => setHoveredSeriesKey(null)}
						opacity={hoveredSeriesKey !== null && hoveredSeriesKey !== serie.dataKey ? 0.5 : 1}
						dot={{
							r: 3,
							fill: serie.color,
							stroke: serie.color,
						}}
						activeDot={{
							r: 5,
							fill: serie.color,
							stroke: "none",
						}}
					/>
				))}

				{thresholdLines.map((line) => (
					<ThresholdLine key={line.key} y={line.y} dangerLevel={line.dangerLevel} />
				))}

				<Legend
					content={() => (
						<div className="mt-2 flex flex-col gap-3" style={{ marginLeft: Y_AXIS_WIDTH }}>
							<SensorLegend
								items={seriesDefinitions.map((serie) => ({
									label: getSeriesLabel(serie.sensor, serie.sensorField, t),
									color: serie.color,
								}))}
							/>
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
	const threshold = getThreshold(serie.sensor, serie.sensorField);
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
		sensor: serie.sensor,
		sensorField: serie.sensorField,
		dataKey: getSeriesDataKey(serie.sensor, serie.sensorField),
		label: getSeriesLabel(serie.sensor, serie.sensorField, t),
		color: getSeriesColor(serie.sensor, serie.sensorField),
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

function getSeriesDataKey(sensor: Sensor, field?: SensorTypeField): string {
	return field ? `${sensor}:${field}` : sensor;
}

function getSeriesLabel(
	sensor: Sensor,
	field: SensorTypeField | undefined,
	t: ReturnType<typeof useTranslation>["t"],
): string {
	if (!field) {
		return t(($) => $.sensors[sensor]);
	}

	return t(($) => $.sensors.dustExposureLabels[field]);
}

function getSeriesColor(sensor: Sensor, field?: SensorTypeField): string {
	if (sensor === "dust") {
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

	return "var(--color-green-700)";
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
