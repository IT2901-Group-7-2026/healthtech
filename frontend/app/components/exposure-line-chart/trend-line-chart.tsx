import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import type { SensorDto, SensorTypeField } from "@/lib/dto";
import type { Sensor, SensorUnit } from "@/lib/sensors";
import { cn, formatSensorValue } from "@/lib/utils";
import { DangerLevels } from "@/lib/danger-levels";
import { getThreshold } from "@/lib/thresholds";
import { addDays, addWeeks, endOfMonth, endOfWeek, getISOWeek, startOfDay, startOfMonth, startOfWeek } from "date-fns";
import { type JSX, useState } from "react";
import { useTranslation } from "react-i18next";
import { CartesianGrid, Legend, Line, LineChart, XAxis, YAxis } from "recharts";
import type { CurveType } from "recharts/types/shape/Curve";
import { SensorLegend } from "./sensor-legend";
import { ThresholdLegend } from "./threshold-legend";
import { ThresholdLine } from "./threshold-line";

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

type SeriesDefinition = {
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

	const bucketDates = getBucketDates(selectedDate, granularity);
	const seriesDefinitions = buildSeriesDefinitions(series, granularity, t);
	const chartData = buildChartData(bucketDates, seriesDefinitions, granularity);

	const [hoveredSeriesKey, setHoveredSeriesKey] = useState<string | null>(null);

	const isSingleSeries = seriesDefinitions.length === 1;

	const activeSeriesKey = isSingleSeries ? (seriesDefinitions[0]?.dataKey ?? null) : hoveredSeriesKey;

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

				<Tooltip unit={unit} seriesDefinitions={seriesDefinitions} />

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

				{seriesDefinitions.map((serie) => {
					if (activeSeriesKey !== serie.dataKey) {
						return null;
					}

					const threshold = getThreshold(serie.sensor, serie.sensorField);

					const thresholdLines: Array<JSX.Element> = [];

					if (threshold.peakDanger && usePeakDangerThreshold) {
						thresholdLines.push(
							<ThresholdLine
								key={`${serie.dataKey}-danger`}
								y={threshold.peakDanger}
								dangerLevel="danger"
							/>,
						);
					} else {
						if (threshold.warning) {
							thresholdLines.push(
								<ThresholdLine
									key={`${serie.dataKey}-warning`}
									y={threshold.warning}
									dangerLevel="warning"
								/>,
							);
						}

						if (threshold.danger) {
							thresholdLines.push(
								<ThresholdLine
									key={`${serie.dataKey}-danger`}
									y={threshold.danger}
									dangerLevel="danger"
								/>,
							);
						}
					}

					return thresholdLines;
				})}

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
): Array<Record<string, string | number | null>> {
	return bucketDates.map((date) => {
		const bucketKey = normalizeBucketKey(date, granularity);

		const row: Record<string, string | number | null> = {
			bucketKey,
			label: granularity === "week" ? `W${getISOWeek(date)}` : formatDayLabel(date),
		};

		for (const serie of seriesDefinitions) {
			row[serie.dataKey] = serie.valuesByBucket.get(bucketKey) ?? null;
		}

		return row;
	});
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

// TODO: use date fns
function formatDayLabel(date: Date): string {
	const day = String(date.getDate()).padStart(2, "0");
	const month = String(date.getMonth() + 1).padStart(2, "0");

	return `${day}.${month}`;
}

function Tooltip({ unit, seriesDefinitions }: { unit: SensorUnit; seriesDefinitions: Array<SeriesDefinition> }) {
	const { t } = useTranslation();

	return (
		<ChartTooltip
			cursor={false}
			content={({ active, payload, label }) => {
				if (!(active && payload?.length)) {
					return null;
				}

				return (
					<div className="rounded-md border bg-background p-3 shadow">
						<div className="mb-2 font-medium">{label}</div>

						<div className="space-y-1">
							{payload.map((entry) => {
								const series = seriesDefinitions.find(
									(seriesDefinition) => seriesDefinition.dataKey === entry.dataKey,
								);

								return (
									<div
										key={String(entry.dataKey)}
										className="flex items-center justify-between gap-4"
									>
										<div className="flex items-center gap-2">
											<div
												className="h-2 w-2 rounded-full"
												style={{ backgroundColor: entry.color }}
											/>
											<span>{series?.label ?? entry.name}</span>
										</div>

										<span>
											{formatSensorValue(entry.value, unit)} {t(($) => $.sensors.units[unit])}
										</span>
									</div>
								);
							})}
						</div>
					</div>
				);
			}}
		/>
	);
}
