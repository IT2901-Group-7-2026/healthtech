"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { useDate } from "@/features/date-picker/use-date";
import { type DangerLevel, DangerLevels } from "@/lib/danger-levels";
import type { SensorDataResponseDto, UserSensorStatusDto } from "@/lib/dto";
import type { Sensor } from "@/lib/sensors";
import { thresholds } from "@/lib/thresholds";
import { downsampleSensorData } from "@/lib/utils";
import {
	addHours,
	endOfDay,
	getHours,
	max,
	min,
	startOfDay,
	subHours,
} from "date-fns";
import { useId } from "react";
import { useTranslation } from "react-i18next";
import {
	type ActiveDotProps,
	CartesianGrid,
	Line,
	LineChart,
	ReferenceLine,
	XAxis,
	YAxis,
} from "recharts";
import type { CurveType } from "recharts/types/shape/Curve";

const chartConfig = {
	desktop: {
		label: "Desktop",
		color: "var(--chart-1)",
	},
} satisfies ChartConfig;

interface LineChartProps {
	chartData: Array<SensorDataResponseDto>;
	chartTitle: string;
	maxY: number;
	minY: number;
	unit: string;
	lineType?: string;
	children: React.ReactNode;
	sensor: Sensor;
	headerRight?: React.ReactNode;
	usePeakData?: boolean;
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
}: LineChartProps) {
	const { date: selectedDay } = useDate();
	const { t } = useTranslation();
	const id = useId();

	const { warning, danger, peakDanger } = thresholds[sensor];
	const dangerThreshold = usePeakData && peakDanger ? peakDanger : danger;

	const getValue = (data: SensorDataResponseDto) =>
		usePeakData ? (data.peakValue ?? data.value) : data.value;

	const maxData = chartData.toSorted((a, b) => getValue(b) - getValue(a))[0];
	const minData = chartData.toSorted((a, b) => getValue(a) - getValue(b))[0];

	// Set the domain to be from 1 hour before the first data point to 1 hour after the last data point, clamped to the current day
	const minTime = chartData.toSorted(
		(a, b) => a.time.getTime() - b.time.getTime(),
	)[0].time;
	const maxTime = chartData.toSorted(
		(a, b) => b.time.getTime() - a.time.getTime(),
	)[0].time;

	const paddedStart = subHours(minTime, 1);
	const paddedEnd = addHours(maxTime, 1);

	const clampedStart = max([paddedStart, startOfDay(minTime)]);
	const clampedEnd = min([paddedEnd, endOfDay(maxTime)]);

	const startHour = getHours(clampedStart);
	const endHour = getHours(clampedEnd);

	// Used to position color-changes in the graph so the line changes color at threshold boundaries.
	const getOffset = (y: number) =>
		`${((getValue(maxData) - y) / (getValue(maxData) - getValue(minData))) * 100}%`;

	const downsampledData = downsampleSensorData(sensor, chartData);

	const transformedData = downsampledData.map((item) => ({
		time: item.time.getTime(),
		value: getValue(item),
	}));

	const ticks = Array.from({ length: endHour - startHour + 1 }, (_, i) => {
		const date = new Date(selectedDay);
		date.setUTCHours(startHour + i);
		return date.getTime();
	});

	const formatTime = (time: number) =>
		new Date(time).getUTCHours().toString().padStart(2, "0");

	const maxDataDangerLevel = getDangerLevel(maxData, usePeakData);

	return (
		<Card className="w-full">
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle>{chartTitle}</CardTitle>
				{headerRight}
			</CardHeader>
			<CardContent>
				<ChartContainer config={chartConfig}>
					<LineChart
						accessibilityLayer
						data={transformedData}
						margin={{
							left: 12,
							right: 12,
						}}
					>
						<CartesianGrid vertical={false} />
						<XAxis
							dataKey="time"
							type="number"
							tickFormatter={formatTime}
							ticks={ticks}
							tickLine={false}
							axisLine={false}
							tickMargin={2}
							label={{
								value: t(($) => $.time),
								position: "insideBottom",
								offset: 0,
							}}
						/>
						<YAxis
							dataKey="value"
							tickLine={false}
							axisLine={false}
							domain={[minY, maxY]}
							label={{
								value: unit,
								position: "inside",
								offset: -5,
								angle: -90,
							}}
						/>
						<ChartTooltip
							cursor={false}
							content={<ChartTooltipContent hideLabel />}
							formatter={(value?: number) => [
								`${value?.toFixed(2) ?? "N/A"}`,
								` ${unit}`,
							]}
						/>

						<defs>
							<linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
								{maxDataDangerLevel === "safe" ? (
									<>
										{/* Whole line is green */}
										<stop
											offset="0%"
											stopColor="var(--safe)"
										/>
										<stop
											offset="100%"
											stopColor="var(--safe)"
										/>
									</>
								) : maxDataDangerLevel === "warning" ? (
									<>
										{/* Green and yellow line*/}
										<stop
											offset={getOffset(warning)}
											stopColor="var(--warning)"
										/>
										<stop
											offset={getOffset(warning)}
											stopColor="var(--safe)"
										/>

										<stop
											offset="100%"
											stopColor="var(--safe)"
										/>
									</>
								) : (
									maxDataDangerLevel === "danger" && (
										<>
											{/* green, yellow and red line */}
											<stop
												offset={getOffset(
													dangerThreshold,
												)}
												stopColor={"var(--danger)"}
											/>
											<stop
												offset={getOffset(
													dangerThreshold,
												)}
												stopColor={"var(--warning)"}
											/>
											<stop
												offset={getOffset(warning)}
												stopColor={"var(--warning)"}
											/>
											<stop
												offset={getOffset(warning)}
												stopColor={"var(--safe)"}
											/>
											<stop
												offset="100%"
												stopColor={"var(--safe)"}
											/>
										</>
									)
								)}
							</linearGradient>
						</defs>
						<Line
							dataKey="value"
							type={lineType as CurveType}
							stroke={`url(#${id})`}
							strokeWidth={1.25}
							dot={false}
							activeDot={(props) => (
								<Dot
									{...props}
									warning={warning}
									danger={danger}
								/>
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

const Dot = ({ cx, cy, value, warning, danger }: DotProps) => {
	let fillColor: string;

	if (value >= danger) {
		fillColor = "var(--danger)";
	} else if (value >= warning) {
		fillColor = "var(--warning)";
	} else {
		fillColor = "var(--safe)";
	}

	return <circle cx={cx} cy={cy} r={6} fill={fillColor} />;
};

export function ThresholdLine({
	y,
	dangerLevel,
	label,
}: {
	y: number;
	dangerLevel: DangerLevel;
	label?: string;
}) {
	const { t } = useTranslation();
	const color = `var(--${DangerLevels[dangerLevel].color})`;
	const lineLabel = label ?? t(($) => $.line_chart[dangerLevel]);
	return (
		<ReferenceLine
			y={y}
			stroke={color}
			strokeDasharray="4 4"
			label={{
				value: lineLabel,
				position: "left",
				fill: color,
				offset: 10,
				dy: -12,
				fontSize: "75%",
			}}
		/>
	);
}

function getDangerLevel(
	data: UserSensorStatusDto,
	usePeakData: boolean,
): DangerLevel {
	if (usePeakData) {
		// biome-ignore lint/style/noNonNullAssertion: If usePeakData is true and peakDangerLevel is null, there is a bug somewhere else
		return data.peakDangerLevel!;
	}

	return data.dangerLevel;
}
