import { ExposureTooltip } from "@/components/exposure-line-chart/exposure-tooltip";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";
import { useFormatDate } from "@/hooks/use-format-date";
import { getLocale } from "@/i18n/locale";
import { DangerLevels } from "@/lib/danger-levels";
import { now as getNow, toTZDate } from "@/lib/date";
import type { SensorDto, SensorTypeField } from "@/lib/dto";
import type { Sensor, SensorUnit } from "@/lib/sensors";
import { getThreshold } from "@/lib/thresholds";
import { cn, formatSensorValue } from "@/lib/utils";
import { TZDate } from "@date-fns/tz";
import { addMinutes, formatDistanceToNowStrict } from "date-fns";
import { type PropsWithChildren, useId } from "react";
import { useTranslation } from "react-i18next";
import { CartesianGrid, Legend, Line, LineChart, XAxis, type XAxisTickContentProps, YAxis } from "recharts";
import type { CurveType } from "recharts/types/shape/Curve";
import { ExposureDot } from "./exposure-dot";
import { ExposureLineChartGradientStops } from "./exposure-line-chart-gradient-stops";
import { ThresholdLegend } from "./threshold-legend";

export type XAxisMode = "default" | "windowed";

const Y_AXIS_WIDTH = 60;

const chartConfig = {
	desktop: {
		label: "Desktop",
		color: "var(--chart-1)",
	},
} satisfies ChartConfig;

type LineChartVariant = "default" | "compact";

export interface ExposureLineChartProps extends PropsWithChildren {
	chartData: Array<SensorDto>;
	maxY: number;
	minY: number;
	unit: SensorUnit;
	lineType?: CurveType;
	sensor: Sensor;
	usePeakData?: boolean;
	dustField?: SensorTypeField;

	chartContainerClassName?: string;
	showLegend?: boolean;

	variant?: LineChartVariant;
	xAxisMode?: XAxisMode;
	minTime: Date;
	maxTime: Date;
}

export function ExposureLineChart({
	chartData,
	maxY,
	minY,
	unit,
	lineType = "linear",
	children,
	sensor,
	usePeakData = false,
	dustField,
	minTime,
	maxTime,
	chartContainerClassName,
	variant = "default",
	showLegend = true,
	xAxisMode = "default",
}: ExposureLineChartProps) {
	const { t, i18n } = useTranslation();
	const id = useId();
	const formatDate = useFormatDate();

	const { warning, danger, peakDanger } = getThreshold(sensor, dustField);
	const dangerThreshold = usePeakData && peakDanger ? peakDanger : danger;

	const transformedData = chartData.map((item) => ({
		time: item.time.getTime(),
		value: usePeakData ? (item.peakValue ?? item.value) : item.value,
	}));

	const xMin = minTime.getTime();
	const xMax = maxTime.getTime();

	const rawTicks = buildTicks(xAxisMode, minTime, maxTime);
	const ticks = limitTicks(rawTicks, 6);

	const compact = variant === "compact";

	const formatTime = (time: number) => formatDate(toTZDate(time), "HH:mm");

	const noData = transformedData.length === 0;

	if (noData) {
		return (
			<ChartContainer
				config={chartConfig}
				className={cn("h-full w-full", chartContainerClassName, compact && "!aspect-auto")}
			>
				<p className="absolute inset-0 flex items-center justify-center text-[1.2vw]">
					{t(($) => $.foremanDashboard.overview.pieChart.noData)}
				</p>
			</ChartContainer>
		);
	}

	return (
		<ChartContainer
			config={chartConfig}
			className={cn("h-full w-full", chartContainerClassName, compact && "!aspect-auto")}
		>
			<LineChart
				accessibilityLayer={true}
				data={transformedData}
				margin={
					compact
						? undefined
						: {
								left: 12,
								right: 12,
							}
				}
			>
				<CartesianGrid vertical={true} strokeDasharray="3 3" />
				<XAxis
					dataKey="time"
					type="number"
					domain={[xMin, xMax]}
					ticks={ticks}
					interval={0}
					allowDataOverflow={true}
					tickLine={false}
					axisLine={false}
					tickMargin={8}
					tick={(props) => (
						<CustomXAxisTick
							{...props}
							variant={variant}
							formatTime={formatTime}
							xMin={xMin}
							xMax={xMax}
							xAxisMode={xAxisMode}
							t={t}
							locale={i18n.language}
						/>
					)}
				/>
				<YAxis
					dataKey="value"
					width={compact ? Y_AXIS_WIDTH : undefined}
					tickLine={false}
					axisLine={false}
					tick={{
						className: compact ? "text-sm" : "text-base",
						fill: "var(--color-muted-foreground)",
					}}
					domain={[minY, maxY]}
					label={
						compact
							? undefined
							: {
									value: t(($) => $.sensors.units[unit]),
									position: "inside",
									dx: -32,
									angle: -90,
									className: "text-lg mr-4",
									fill: "var(--color-muted-foreground)",
								}
					}
					// Only dustchart with mg unit need to show decimals on y axis
					tickFormatter={(value) => formatSensorValue(value, unit as SensorUnit, 0, { mg: 3 })}
				/>
				<ExposureTooltip unit={unit} />

				<defs>
					<linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
						<ExposureLineChartGradientStops
							values={transformedData.map((point) => point.value)}
							warningThreshold={warning}
							dangerThreshold={dangerThreshold}
							usePeakData={usePeakData}
						/>
					</linearGradient>
				</defs>
				<Line
					dataKey="value"
					type={lineType}
					stroke={`url(#${id})`}
					strokeWidth={1.25}
					isAnimationActive={false}
					animationDuration={0}
					dot={false}
					activeDot={(props) => (
						<ExposureDot {...props} warning={warning} danger={dangerThreshold} isPeak={usePeakData} />
					)}
				/>
				{children}
				{showLegend && (
					<Legend
						verticalAlign="bottom"
						align="left"
						content={() => (
							<div style={{ marginLeft: Y_AXIS_WIDTH }}>
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
				)}
			</LineChart>
		</ChartContainer>
	);
}

type CustomXAxisTickProps = XAxisTickContentProps & {
	xMin: number;
	xMax: number;
	variant: LineChartVariant;
	formatTime: (time: number) => string;
	xAxisMode?: XAxisMode;
	t: ReturnType<typeof useTranslation>["t"];
	locale: string;
};

function CustomXAxisTick({
	x,
	y,
	xMin,
	xMax,
	payload,
	formatTime,
	variant,
	xAxisMode,
	t,
	locale,
}: CustomXAxisTickProps) {
	const value: number = payload.value ?? 0;

	const isFirst = value === xMin;
	const isLast = value === xMax;

	let label = formatTime(value);

	if (xAxisMode === "windowed") {
		if (isLast) {
			label = t(($) => $.live.chart.now);
		} else {
			label = formatMsToDistanceString(xMax - value, locale);
		}
	}

	return (
		<text
			x={x}
			y={y}
			textAnchor={isFirst ? "start" : isLast ? "end" : "middle"}
			fill="var(--color-muted-foreground)"
			fontSize={12}
			className={cn(variant === "compact" ? "text-sm" : "text-base")}
		>
			{label}
		</text>
	);
}

function formatMsToDistanceString(msDiff: number, language: string) {
	const minutes = Math.round(msDiff / (1000 * 60));

	const now = getNow();
	const date = addMinutes(now, -minutes);

	const locale = getLocale(language);

	return formatDistanceToNowStrict(date, {
		locale,
	}).replace("en", "1");
}

function buildTicks(xAxisMode: XAxisMode, minTime: Date, maxTime: Date) {
	const min = minTime.getTime();
	const max = maxTime.getTime();

	if (xAxisMode === "windowed") {
		// Always include edges
		const ticks = [min, max];

		// Add ticks per hour
		const current = new TZDate(minTime);

		while (current < maxTime) {
			const t = current.getTime();

			if (t > min) {
				ticks.push(t);
			}

			current.setHours(current.getHours() + 1);
		}

		ticks.sort((a, b) => a - b);

		return ticks;
	}

	const current = new TZDate(minTime);
	current.setMinutes(0, 0, 0);

	const end = new TZDate(maxTime);
	end.setMinutes(0, 0, 0);

	const ticks = [];

	while (current <= end) {
		ticks.push(current.getTime());
		current.setHours(current.getHours() + 1);
	}

	return ticks;
}

function limitTicks(ticks: Array<number>, maxTicks: number) {
	if (ticks.length <= maxTicks) {
		return ticks;
	}

	const step = Math.ceil((ticks.length - 1) / (maxTicks - 1));
	const result = ticks.filter((_, i) => i % step === 0);

	// Ensure first & last are always included
	if (result[0] !== ticks[0]) {
		result.unshift(ticks[0]);
	}

	if (result[result.length - 1] !== ticks[ticks.length - 1]) {
		result.push(ticks[ticks.length - 1]);
	}

	return result;
}
