"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { useDate } from "@/features/date-picker/use-date";
import { useSensor } from "@/features/sensor-picker/use-sensor";
import { type DangerLevel, DangerLevels } from "@/lib/danger-levels";
import type { SensorDataResponseDto } from "@/lib/dto";
import { thresholds } from "@/lib/thresholds";
import { useId } from "react";
import { useTranslation } from "react-i18next";
import {
	CartesianGrid,
	Line,
	LineChart,
	ReferenceLine,
	XAxis,
	YAxis,
} from "recharts";
import type { CurveType } from "recharts/types/shape/Curve";

export const description = "A line chart";

const chartConfig = {
	desktop: {
		label: "Desktop",
		color: "var(--chart-1)",
	},
} satisfies ChartConfig;

export function ChartLineDefault({
	chartData,
	chartTitle,
	startHour,
	endHour,
	maxY,
	unit,
	lineType = "natural",
	children,
}: {
	chartData: Array<SensorDataResponseDto>;
	chartTitle: string;
	startHour: number;
	endHour: number;
	maxY: number;
	unit: string;
	lineType?: string;
	children: React.ReactNode;
}) {
	const { date: selectedDay } = useDate();

	const { t } = useTranslation();

	const id = useId();

	const { sensor } = useSensor();
	const { warning, danger } = thresholds[sensor];

	const maxData = [...chartData].sort((a, b) => b.value - a.value)[0];
	const minData = [...chartData].sort((a, b) => a.value - b.value)[0];

	// Used to position color-changes in the graph so the line changes color at threshold boundaries.
	const getOffset = (y: number) =>
		`${((maxData.value - y) / (maxData.value - minData.value)) * 100}%`;

	const transformedData = chartData.map((item) => ({
		time: item.time.getTime(),
		value: item.value,
	}));

	const ticks = Array.from({ length: endHour - startHour + 1 }, (_, i) => {
		const date = new Date(selectedDay);
		date.setUTCHours(startHour + i);
		return date.getTime();
	});

	const formatTime = (time: number) =>
		new Date(time).getUTCHours().toString().padStart(2, "0");

	return (
		<Card className="w-full">
			<CardHeader>
				<CardTitle>{chartTitle}</CardTitle>
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
							domain={[0, maxY]}
							label={{
								value: unit,
								position: "insideCenter",
								offset: -5,
								angle: -90,
							}}
						/>
						<ChartTooltip
							cursor={false}
							content={<ChartTooltipContent hideLabel />}
							formatter={(value: number) => [
								`${value.toFixed(2)}`,
								` ${unit}`,
							]}
						/>

						<defs>
							<linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
								{maxData.dangerLevel === "safe" ? (
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
								) : maxData.dangerLevel === "warning" ? (
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
									maxData.dangerLevel === "danger" && (
										<>
											{/* green, yellow and red line */}
											<stop
												offset={getOffset(danger)}
												stopColor="var(--danger)"
											/>
											<stop
												offset={getOffset(danger)}
												stopColor="var(--warning)"
											/>
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
									)
								)}
							</linearGradient>
						</defs>
						<Line
							dataKey="value"
							type={lineType as CurveType}
							stroke={`url(#${id})`}
							strokeWidth={2}
							dot={false}
							activeDot={<Dot />}
						/>
						{children}
					</LineChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}

// biome-ignore lint/suspicious/noExplicitAny: cannot find the correct type for props here.
const Dot = (props: any) => {
	const { cx, cy, value, isActive } = props;

	const { sensor } = useSensor();
	const { warning, danger } = thresholds[sensor];

	const fillColor =
		value < warning
			? "var(--safe)"
			: value < danger
				? "var(--warning)"
				: "var(--danger)";

	return <circle cx={cx} cy={cy} r={isActive ? 6 : 3} fill={fillColor} />;
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
				offset: -80,
				dy: -10,
			}}
		/>
	);
}
