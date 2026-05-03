import { ExposureTooltip } from "@/components/exposure-line-chart/exposure-tooltip";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";
import { useFormatDate } from "@/hooks/use-format-date";
import { getLocale } from "@/i18n/locale";
import { DangerLevels } from "@/lib/danger-levels";
import { now as getNow, toTZDate } from "@/lib/date";
import type { ExposureDto, ExposureTypeField } from "@/lib/dto";
import type { Exposure, ExposureUnit } from "@/lib/exposures";
import { getThreshold } from "@/lib/thresholds";
import { buildYAxisTicks, cn, DUST_Y_AXIS_STEP, formatExposureValue } from "@/lib/utils";
import { TZDate } from "@date-fns/tz";
import { addMinutes, formatDistanceToNowStrict } from "date-fns";
import { type PropsWithChildren, useId } from "react";
import { useTranslation } from "react-i18next";
import { Area, CartesianGrid, ComposedChart, Legend, Line, XAxis, type XAxisTickContentProps, YAxis } from "recharts";
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
	chartData: Array<ExposureDto>;
	maxY: number;
	minY: number;
	unit: ExposureUnit;
	lineType?: CurveType;
	exposure: Exposure;
	usePeakData?: boolean;
	dustField?: ExposureTypeField;

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
	exposure,
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

	const { warning, danger, peakDanger } = getThreshold(exposure, dustField);
	const dangerThreshold = usePeakData && peakDanger ? peakDanger : danger;
	const yTicks = exposure === "dust" ? buildYAxisTicks(minY, maxY, DUST_Y_AXIS_STEP) : undefined;
	const defaultFractionDigits = exposure === "dust" ? 1 : 0;
	const fractionDigitsPerUnit = exposure === "dust" ? { mg: 4 } : { mg: 3 };

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

	// Pre-calculate values to ensure the Area's gradient bounding box perfectly matches
	const dataValues = transformedData.map((point) => point.value);
	const maxDataValue = dataValues.length > 0 ? Math.max(...dataValues) : maxY;

	return (
		<ChartContainer
			config={chartConfig}
			className={cn("h-full w-full", chartContainerClassName, compact && "!aspect-auto")}
		>
			<ComposedChart
				accessibilityLayer={true}
				data={transformedData}
				margin={
					compact
						? undefined
						: {
								left: 12,
								right: 12,
								top: 12,
							}
				}
			>
				<CartesianGrid vertical={true} stroke="var(--color-muted-foreground)" strokeOpacity={0.3} />
				<XAxis
					dataKey="time"
					type="number"
					domain={[xMin, xMax]}
					ticks={ticks}
					interval={0}
					allowDataOverflow={true}
					tickLine={false}
					axisLine={false}
					tickMargin={12}
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
						className: compact ? "text-xs" : "text-sm",
						fill: "var(--color-muted-foreground)",
					}}
					domain={[minY, maxY]}
					ticks={yTicks}
					label={
						compact
							? undefined
							: {
									value: t(($) => $.exposures.units[unit]),
									position: "inside",
									dx: -32,
									angle: -90,
									className: "text-lg mr-4",
									fill: "var(--color-muted-foreground)",
								}
					}
					tickFormatter={(value) =>
						formatExposureValue(value, unit as ExposureUnit, defaultFractionDigits, fractionDigitsPerUnit)
					}
				/>
				<ExposureTooltip unit={unit} />
				<defs>
					{/* Gradient for line stroke */}
					<linearGradient id={`${id}-line`} x1="0" y1="0" x2="0" y2="1">
						<ExposureLineChartGradientStops
							values={dataValues}
							warningThreshold={warning}
							dangerThreshold={dangerThreshold}
							usePeakData={usePeakData}
						/>
					</linearGradient>

					{/* Gradient for area background */}
					<linearGradient id={`${id}-area`} x1="0" y1="0" x2="0" y2="1">
						<ExposureLineChartGradientStops
							values={[minY, maxDataValue]}
							warningThreshold={warning}
							dangerThreshold={dangerThreshold}
							usePeakData={usePeakData}
						/>
					</linearGradient>

					<linearGradient id={`${id}-fade-gradient`} x1="0" y1="0" x2="0" y2="1">
						{/* How much of the gradient (50%) should be fully visible until it starts fading out */}
						<stop offset="0%" stopColor="white" stopOpacity={1} />
						<stop offset="50%" stopColor="white" stopOpacity={1} />

						{/* Fades out completely at the bottom (100%) */}
						<stop offset="100%" stopColor="white" stopOpacity={0} />
					</linearGradient>

					<mask id={`${id}-fade-mask`}>
						<rect x="0" y="0" width="100%" height="100%" fill={`url(#${id}-fade-gradient)`} />
					</mask>
				</defs>
				<Area
					dataKey="value"
					type={lineType}
					fill={`url(#${id}-area)`}
					stroke="none"
					baseValue={minY}
					fillOpacity={0.25}
					mask={`url(#${id}-fade-mask)`}
					isAnimationActive={false}
					animationDuration={0}
				/>
				<Line
					dataKey="value"
					type={lineType}
					stroke={`url(#${id}-line)`}
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
			</ComposedChart>
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
			className={cn(variant === "compact" ? "text-xs" : "text-sm")}
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
		const ticks = [min, max];

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

	if (result[0] !== ticks[0]) {
		result.unshift(ticks[0]);
	}

	if (result[result.length - 1] !== ticks[ticks.length - 1]) {
		result.push(ticks[ticks.length - 1]);
	}

	return result;
}
