import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useDate } from "@/features/date-picker/use-date";
import { useFormatDate } from "@/hooks/use-format-date";
import { type DangerLevel, DangerLevels } from "@/lib/danger-levels";
import { toTZDate } from "@/lib/date";
import type { SensorDataResponseDto, SensorTypeField } from "@/lib/dto";
import type { Sensor } from "@/lib/sensors";
import { getThreshold } from "@/lib/thresholds";
import { cn } from "@/lib/utils";
import { useId } from "react";
import { useTranslation } from "react-i18next";
import { type ActiveDotProps, CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";
import type { CurveType } from "recharts/types/shape/Curve";

const chartConfig = {
	desktop: {
		label: "Desktop",
		color: "var(--chart-1)",
	},
} satisfies ChartConfig;

interface LineChartProps {
	chartData: Array<SensorDataResponseDto>;
	chartTitle?: string;
	maxY: number;
	minY: number;
	unit: string;
	lineType?: string;
	children: React.ReactNode;
	sensor: Sensor;
	headerRight?: React.ReactNode;
	usePeakData?: boolean;
	dustField?: SensorTypeField;
	minHour?: number;
	maxHour?: number;
	minTime?: number | Date;
	maxTime?: number | Date;
	startTickLabel?: string;
	endTickLabel?: string;
	hideLabels?: boolean;
	disableAnimation?: boolean;
	className?: string;
	contentClassName?: string;
	chartContainerClassName?: string;
	hideHeader?: boolean;
	muteTickLabels?: boolean;
}

type CustomXAxisTickProps = {
	x?: number | string;
	y?: number | string;
	payload?: { value?: number | string };
	ticks: Array<number>;
	getLabel: (value: number, index: number) => string;
	muteTickLabels?: boolean;
};

function CustomXAxisTick({ x = 0, y = 0, payload, ticks, getLabel, muteTickLabels }: CustomXAxisTickProps) {
	const xPos = typeof x === "number" ? x : Number(x) || 0;
	const yPos = typeof y === "number" ? y : Number(y) || 0;

	const rawValue = payload?.value ?? 0;
	const value = typeof rawValue === "number" ? rawValue : Number(rawValue) || 0;

	const index = ticks.indexOf(value);
	const isFirst = index === 0;
	const isLast = index === ticks.length - 1;

	return (
		<text
			x={xPos}
			y={yPos}
			textAnchor={isFirst ? "start" : isLast ? "end" : "middle"}
			fill="var(--color-muted-foreground)"
			fontSize={12}
			className={cn(muteTickLabels ? "text-sm" : "text-base")}
		>
			{getLabel(value, index)}
		</text>
	);
}

export function ChartLineDefault({
	chartData,
	chartTitle,
	maxY,
	minY,
	unit,
	lineType = "natural",
	children,
	sensor,
	headerRight,
	usePeakData = false,
	dustField,
	minHour,
	maxHour,
	minTime,
	maxTime,
	startTickLabel,
	endTickLabel,
	hideLabels,
	disableAnimation = false,
	className,
	contentClassName,
	chartContainerClassName,
	hideHeader,
	muteTickLabels,
}: LineChartProps) {
	const { date: selectedDay } = useDate();
	const { t } = useTranslation();
	const id = useId();
	const formatDate = useFormatDate();

	const { warning, danger, peakDanger } = getThreshold(sensor, dustField);
	const dangerThreshold = usePeakData && peakDanger ? peakDanger : danger;

	const getValue = (data: SensorDataResponseDto) => (usePeakData ? (data.peakValue ?? data.value) : data.value);

	const maxData = chartData.toSorted((a, b) => getValue(b) - getValue(a))?.[0];
	const minData = chartData.toSorted((a, b) => getValue(a) - getValue(b))?.[0];

	const getOffset = (y: number) =>
		maxData && minData ? `${((getValue(maxData) - y) / (getValue(maxData) - getValue(minData))) * 100}%` : "0%";

	const transformedData = chartData.map((item) => ({
		time: item.time.getTime(),
		value: getValue(item),
	}));

	const resolvedMinTime = minTime instanceof Date ? minTime.getTime() : minTime;
	const resolvedMaxTime = maxTime instanceof Date ? maxTime.getTime() : maxTime;

	const usesExplicitTimeRange = resolvedMinTime !== undefined && resolvedMaxTime !== undefined;

	if (!usesExplicitTimeRange && (minHour === undefined || maxHour === undefined)) {
		throw new Error("ChartLineDefault requires either minTime/maxTime or minHour/maxHour.");
	}

	const getHourTimestamp = (hour: number) => {
		const date = toTZDate(selectedDay);
		date.setHours(hour, 0, 0, 0);
		return date.getTime();
	};

	let xMin: number;
	let xMax: number;
	let ticks: Array<number>;

	if (usesExplicitTimeRange) {
		xMin = resolvedMinTime;
		xMax = resolvedMaxTime;
		ticks = [xMin, xMax];
	} else {
		const boundedMinHour = minHour ?? 0;
		const boundedMaxHour = maxHour ?? 23;
		xMin = getHourTimestamp(boundedMinHour);
		xMax = getHourTimestamp(boundedMaxHour);
		ticks = Array.from({ length: boundedMaxHour - boundedMinHour + 1 }, (_, i) =>
			getHourTimestamp(boundedMinHour + i),
		);
	}

	const getXAxisTickLabel = (time: number, index: number) => {
		if (usesExplicitTimeRange) {
			if (index === 0) return startTickLabel ?? formatDate(toTZDate(time), "HH:mm");
			if (index === ticks.length - 1) return endTickLabel ?? formatDate(toTZDate(time), "HH:mm");
		}

		return formatDate(toTZDate(time), "HH:mm");
	};

	const dataMin = minData ? getValue(minData) : 0;
	const dataMax = maxData ? getValue(maxData) : 0;

	const isAllDanger = dangerThreshold <= dataMin;
	const isAllWarning = dangerThreshold >= dataMax && warning <= dataMin;
	const isAllSafe = warning >= dataMax;

	return (
		<Card className={cn("w-full", hideLabels && "pl-0", className)}>
			{!hideHeader && (
				<CardHeader className="mb-4 flex flex-row items-center justify-between">
					<CardTitle>{chartTitle}</CardTitle>
					{headerRight}
				</CardHeader>
			)}
			<CardContent className={cn("flex h-full flex-1", contentClassName)}>
				<ChartContainer
					config={chartConfig}
					className={cn("h-full w-full", chartContainerClassName, hideLabels && "!aspect-auto")}
				>
					<LineChart
						accessibilityLayer={true}
						data={transformedData}
						margin={
							hideLabels
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
									ticks={ticks}
									getLabel={getXAxisTickLabel}
									muteTickLabels={muteTickLabels}
								/>
							)}
							label={
								hideLabels
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
							width={hideLabels ? 48 : undefined}
							tickLine={false}
							axisLine={false}
							tick={{
								className: muteTickLabels ? "text-sm" : "text-base",
								fill: "var(--color-muted-foreground)",
							}}
							domain={[minY, maxY]}
							label={
								hideLabels
									? undefined
									: {
											value: unit,
											position: "inside",
											dx: -32,
											angle: -90,
											className: "text-lg mr-4",
											fill: "var(--color-muted-foreground)",
										}
							}
						/>
						<ChartTooltip
							cursor={false}
							content={<ChartTooltipContent hideLabel={true} />}
							formatter={(value?: number) => [`${value?.toFixed(2) ?? "N/A"}`, ` ${unit}`]}
						/>

						<defs>
							<linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
								{isAllDanger ? (
									<>
										<stop offset="0%" stopColor="var(--danger)" />
										<stop offset="100%" stopColor="var(--danger)" />
									</>
								) : isAllWarning ? (
									<>
										<stop offset="0%" stopColor="var(--warning)" />
										<stop offset="100%" stopColor="var(--warning)" />
									</>
								) : isAllSafe ? (
									<>
										<stop offset="0%" stopColor="var(--safe)" />
										<stop offset="100%" stopColor="var(--safe)" />
									</>
								) : usePeakData ? (
									<>
										{/* ONLY green → red */}
										<stop offset={getOffset(dangerThreshold)} stopColor="var(--danger)" />
										<stop offset={getOffset(dangerThreshold)} stopColor="var(--safe)" />
										<stop offset="100%" stopColor="var(--safe)" />
									</>
								) : (
									<>
										{/* normal 3-level */}
										<stop offset={getOffset(dangerThreshold)} stopColor="var(--danger)" />
										<stop offset={getOffset(dangerThreshold)} stopColor="var(--warning)" />
										<stop offset={getOffset(warning)} stopColor="var(--warning)" />
										<stop offset={getOffset(warning)} stopColor="var(--safe)" />

										<stop offset="100%" stopColor="var(--safe)" />
									</>
								)}
							</linearGradient>
						</defs>
						<Line
							dataKey="value"
							type={lineType as CurveType}
							stroke={`url(#${id})`}
							strokeWidth={1.25}
							isAnimationActive={!disableAnimation}
							animationDuration={0}
							dot={false}
							activeDot={(props) => (
								<Dot {...props} warning={warning} danger={dangerThreshold} isPeak={usePeakData} />
							)}
						/>
						{children}
					</LineChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}

type DotProps = ActiveDotProps & { warning: number; danger: number };

const Dot = ({ cx, cy, value, warning, danger, isPeak }: DotProps & { isPeak?: boolean }) => {
	let fillColor: string;

	if (isPeak) {
		fillColor = value >= danger ? "var(--danger)" : "var(--safe)";
	} else if (value >= danger) fillColor = "var(--danger)";
	else if (value >= warning) fillColor = "var(--warning)";
	else fillColor = "var(--safe)";

	return <circle cx={cx} cy={cy} r={6} fill={fillColor} />;
};

export function ThresholdLine({
	y,
	dangerLevel,
	label,
	hideLineLabel,
}: {
	y: number;
	dangerLevel: DangerLevel;
	label?: string;
	hideLineLabel?: boolean;
}) {
	const { t } = useTranslation();
	const color = `var(--${DangerLevels[dangerLevel].color})`;
	const lineLabel = hideLineLabel ? undefined : (label ?? t(($) => $.lineChart[dangerLevel]));

	return (
		<ReferenceLine
			y={y}
			stroke={color}
			strokeDasharray="4 4"
			label={{
				value: lineLabel,
				position: "left",
				fill: color,
				offset: 64,
				dy: -20,
				fontSize: "75%",
				textAnchor: "start",
				className: "text-base",
			}}
		/>
	);
}
