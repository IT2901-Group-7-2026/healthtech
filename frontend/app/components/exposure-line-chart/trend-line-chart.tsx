import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import type { SensorDto, SensorTypeField } from "@/lib/dto";
import type { Sensor, SensorUnit } from "@/lib/sensors";
import { cn, formatSensorValue } from "@/lib/utils";
import { addDays, addWeeks, endOfMonth, endOfWeek, getISOWeek, startOfDay, startOfMonth, startOfWeek } from "date-fns";
import { useTranslation } from "react-i18next";
import { CartesianGrid, Legend, Line, LineChart, XAxis, YAxis } from "recharts";
import type { CurveType } from "recharts/types/shape/Curve";

type TrendGranularity = "day" | "week";

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
}

type SeriesDefinition = {
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
}: TrendLineChartProps) {
	const { t } = useTranslation();

	const bucketDates = getBucketDates(selectedDate, granularity);
	const seriesDefinitions = buildSeriesDefinitions(series, granularity);
	const chartData = buildChartData(bucketDates, seriesDefinitions, granularity);

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
				<Legend wrapperStyle={{ paddingTop: 12 }} />
			</LineChart>
		</ChartContainer>
	);
}

function buildSeriesDefinitions(series: Array<TrendSeries>, granularity: TrendGranularity): Array<SeriesDefinition> {
	return series.map((serie) => ({
		dataKey: getSeriesDataKey(serie.sensor, serie.sensorField),
		label: getSeriesLabel(serie.sensor, serie.sensorField),
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

function getSeriesLabel(sensor: Sensor, field?: SensorTypeField): string {
	const { t } = useTranslation();

	if (!field) {
		return t(($) => $.sensors[sensor]);
	}

	return t(($) => $.sensors.dustExposureLabels[field]);
}

function getSeriesColor(sensor: Sensor, field?: SensorTypeField): string {
	const styleKey = field ? `${sensor}:${field}` : sensor;

	switch (styleKey) {
		case "dust:pm1_twa":
			return "var(--color-green-700)";
		case "dust:pm25_twa":
			return "var(--color-blue-600)";
		case "dust:pm10_twa":
			return "var(--color-orange-400)";
		case "noise":
			return "var(--color-green-700)";
		case "vibration":
			return "var(--color-orange-500)";
		default:
			return "var(--color-blue-500)";
	}
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
