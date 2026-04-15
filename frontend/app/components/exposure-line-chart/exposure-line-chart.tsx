import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useFormatDate } from "@/hooks/use-format-date";
import { type DangerLevel, DangerLevels, dangerlevelStyles, getDangerLevel } from "@/lib/danger-levels";
import { toTZDate } from "@/lib/date";
import type { SensorDto, SensorTypeField } from "@/lib/dto";
import type { Sensor, SensorUnit } from "@/lib/sensors";
import { getThreshold } from "@/lib/thresholds";
import { cn, formatSensorValue } from "@/lib/utils";
import { TZDate } from "@date-fns/tz";
import { type PropsWithChildren, useId } from "react";
import { useTranslation } from "react-i18next";
import {
	type ActiveDotProps,
	CartesianGrid,
	Legend,
	Line,
	LineChart,
	XAxis,
	type XAxisTickContentProps,
	YAxis,
} from "recharts";
import type { CurveType } from "recharts/types/shape/Curve";
import { ThresholdLegend } from "./threshold-legend";

const Y_AXIS_WIDTH = 60;

const chartConfig = {
	desktop: {
		label: "Desktop",
		color: "var(--chart-1)",
	},
} satisfies ChartConfig;

type LineChartVariant = "default" | "compact";

type XAxisTickLabels = {
	start: string;
	end: string;
};

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
	xTickLabels?: XAxisTickLabels;
	minTime: Date;
	maxTime: Date;
}

export function ExposureLineChart({
	chartData,
	maxY,
	minY,
	unit,
	lineType = "natural",
	children,
	sensor,
	usePeakData = false,
	dustField,
	minTime,
	maxTime,
	chartContainerClassName,

	variant = "default",
	showLegend = true,
	xTickLabels,
}: ExposureLineChartProps) {
	const { t } = useTranslation();
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
	let ticks: Array<number>;

	// Either only show tick labels at the start and end of the chart, or show them at every hour within the given time range
	if (xTickLabels) {
		ticks = [xMin, xMax];
	} else {
		// Remove minutes and seconds so ticks only show hours
		const current = new TZDate(minTime);
		current.setMinutes(0, 0, 0);

		const end = new TZDate(maxTime);
		end.setMinutes(0, 0, 0);

		ticks = [];

		while (current <= end) {
			ticks.push(current.getTime());
			current.setHours(current.getHours() + 1);
		}
	}

	const compact = variant === "compact";

	const formatTime = (time: number) => formatDate(toTZDate(time), "HH:mm");

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
							xTickLabels={xTickLabels}
						/>
					)}
					label={
						compact
							? undefined
							: {
									value: t(($) => $.common.time),
									position: "insideBottom",
									offset: 0,
									className: "text-base",
									fill: "var(--color-muted-foreground)",
								}
					}
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
					// only dustchart with mg unit need to show decimals on y axis
					tickFormatter={(value) => formatSensorValue(value, unit as SensorUnit, 0, { mg: 3 })}
				/>
				<ChartTooltip
					cursor={false}
					content={<ChartTooltipContent hideLabel={true} />}
					formatter={(value?: number) => [
						`${formatSensorValue(value, unit as SensorUnit)} ${t(($) => $.sensors.units[unit])}`,
					]}
				/>

				<defs>
					<linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
						<GradientStops
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
						<Dot {...props} warning={warning} danger={dangerThreshold} isPeak={usePeakData} />
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
					></Legend>
				)}
			</LineChart>
		</ChartContainer>
	);
}

type DotProps = ActiveDotProps & { warning: number; danger: number };

const Dot = ({ cx, cy, value, warning, danger, isPeak }: DotProps & { isPeak?: boolean }) => {
	let dangerLevel = getDangerLevel(value, warning, danger);

	dangerLevel = normalizeDangerLevelForPeak(dangerLevel, isPeak);

	const fillColor = dangerlevelStyles[dangerLevel].color;

	return <circle cx={cx} cy={cy} r={6} fill={fillColor} />;
};

type CustomXAxisTickProps = XAxisTickContentProps & {
	xMin: number;
	xMax: number;
	variant: LineChartVariant;
	formatTime: (time: number) => string;
	xTickLabels?: XAxisTickLabels;
};

function CustomXAxisTick({ x, y, xMin, xMax, payload, xTickLabels, formatTime, variant }: CustomXAxisTickProps) {
	const value: number = payload.value ?? 0;

	const isFirst = value === xMin;
	const isLast = value === xMax;

	let label = formatTime(value);

	if (xTickLabels) {
		if (value === xMin) {
			label = xTickLabels.start;
		}
		if (value === xMax) {
			label = xTickLabels.end;
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

interface GradientStopsProps {
	values: Array<number>;
	warningThreshold: number;
	dangerThreshold: number;
	usePeakData?: boolean;
}

function GradientStops({ values, warningThreshold, dangerThreshold, usePeakData }: GradientStopsProps) {
	const minValue = values.length > 0 ? Math.min(...values) : 0;
	const maxValue = values.length > 0 ? Math.max(...values) : 0;

	let minDangerLevel = getDangerLevel(minValue, warningThreshold, dangerThreshold);
	let maxDangerLevel = getDangerLevel(maxValue, warningThreshold, dangerThreshold);

	minDangerLevel = normalizeDangerLevelForPeak(minDangerLevel, usePeakData);
	maxDangerLevel = normalizeDangerLevelForPeak(maxDangerLevel, usePeakData);

	const uniformDangerLevel = minDangerLevel === maxDangerLevel ? minDangerLevel : undefined;

	const getOffset = (y: number) => {
		if (maxValue === minValue) {
			return "0%";
		}

		return `${((maxValue - y) / (maxValue - minValue)) * 100}%`;
	};

	const dangerOffset = getOffset(dangerThreshold);
	const warningOffset = getOffset(warningThreshold);

	// If all values fall within the same danger level, use a solid color for the line instead of a gradient
	if (uniformDangerLevel) {
		const dangerLevelColor = dangerlevelStyles[uniformDangerLevel].color;
		return (
			<>
				<stop offset="0%" stopColor={dangerLevelColor} />
				<stop offset="100%" stopColor={dangerLevelColor} />
			</>
		);
	}

	return (
		<>
			<stop offset={dangerOffset} stopColor="var(--danger)" />

			{/* Only show the warning gradient for non-peak data */}
			{usePeakData ? (
				<stop offset={dangerOffset} stopColor="var(--safe)" />
			) : (
				<>
					<stop offset={dangerOffset} stopColor="var(--warning)" />
					<stop offset={warningOffset} stopColor="var(--warning)" />
					<stop offset={warningOffset} stopColor="var(--safe)" />
				</>
			)}

			<stop offset="100%" stopColor="var(--safe)" />
		</>
	);
}

// Peak data doesn't have a warning danger level, so we treat warning levels as safe
function normalizeDangerLevelForPeak(dangerLevel: DangerLevel, isPeak?: boolean): DangerLevel {
	if (isPeak && dangerLevel === "warning") {
		return "safe";
	}

	return dangerLevel;
}
