"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import type { Sensor } from "@/features/sensor-picker/sensors";
import type { UserWithStatusDto } from "@/lib/dto";
import { getThreshold } from "@/lib/thresholds";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { Bar, BarChart, type BarProps, CartesianGrid, XAxis, YAxis } from "recharts";
import { ThresholdLine } from "./exposure-line-chart/threshold-line";

interface Props {
	users: Array<UserWithStatusDto>;
	sensor: Sensor;
	userOnClick?: (userId: string) => void;
	isWeekly?: boolean;
}

export function UserStatusChart({ users, sensor, userOnClick, isWeekly }: Props) {
	const [t] = useTranslation();
	const threshold = getThreshold(sensor);
	const getPercent = (value: number) => Math.round((value / threshold.danger) * 100);

	const hasAnySensorData = users.some((u) => {
		const sensorStatus = u.status[sensor];
		if (!sensorStatus) return false;

		return getPercent(sensorStatus.value) >= 1;
	});

	const data = users.flatMap((user) => {
		const sensorStatus = user.status[sensor];
		if (!sensorStatus) {
			return [];
		}

		const days = isWeekly ? 7 : 1;

		// Vibration should show average value in graph
		const normalizedValue = sensor === "vibration" ? sensorStatus.value / days : sensorStatus.value;

		const percent = getPercent(normalizedValue);
		// Only show peak if it's above the current value
		const peakPercent =
			sensorStatus.peakValue && sensorStatus.peakValue > sensorStatus.value
				? getPercent(sensorStatus.peakValue)
				: null;

		return [
			{
				name: user.name,
				id: user.id,
				status: sensorStatus.dangerLevel,
				percent,
				peakPercent,
			},
		];
	});

	if (!hasAnySensorData) {
		return (
			<Card className="w-192">
				<CardContent className="flex h-48 items-center justify-center text-muted-foreground text-sm">
					{t(($) => $.foremanDashboard.userStatusChart.noData)}
				</CardContent>
			</Card>
		);
	}

	const warningThresholdLine = (threshold.warning / threshold.danger) * 100;
	const dangerThresholdLine = 100;

	const sortedData = data.toSorted((a, b) => b.percent - a.percent);

	// Split percent into three parts for the stacked bar chart
	const chartData = sortedData.map((item) => ({
		...item,
		safe: Math.min(item.percent, warningThresholdLine),
		warning: Math.min(Math.max(item.percent - warningThresholdLine, 0), dangerThresholdLine - warningThresholdLine),
		danger: Math.max(item.percent - dangerThresholdLine, 0),
		userId: item.id,
	}));

	const maxPercent = Math.max(100, ...chartData.map((item) => item.percent));
	const xDomainPadding = 15;
	const xDomainMax = maxPercent + xDomainPadding;

	const barOnClick: BarProps["onClick"] = (barData) => {
		const row = barData.payload;
		userOnClick?.(row.id);
	};

	// One tick per 25%
	const xTicks = Array.from({ length: Math.ceil(xDomainMax / 25) + 1 }, (_, i) => i * 25);

	return (
		<Card className="w-192 py-0">
			<CardContent className="px-2 sm:p-6">
				<ChartContainer
					config={{}}
					className={cn(
						"aspect-auto h-[520px] w-full",
						userOnClick && "[&_.recharts-bar-rectangle]:cursor-pointer",
					)}
				>
					<BarChart
						accessibilityLayer={true}
						layout="vertical"
						data={chartData}
						margin={{
							bottom: 32,
							top: 24,
							left: 12,
						}}
						maxBarSize={48}
					>
						<CartesianGrid horizontal={false} />
						<XAxis
							type="number"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							domain={[0, xDomainMax]}
							tickFormatter={(v) => `${v}%`}
							ticks={xTicks}
							label={{
								value: t(($) => $.foremanDashboard.userStatusChart.xAxisLabel),
								position: "insideBottom",
								offset: -24,
								className: "text-base",
								fill: "var(--color-muted-foreground)",
							}}
							tick={{
								className: "text-base",
								fill: "var(--color-muted-foreground)",
							}}
						/>
						<YAxis
							type="category"
							dataKey="name"
							tickLine={false}
							axisLine={false}
							width={120}
							tick={({ x, y, payload, index }) => {
								const user = chartData[index];

								const width = 120;
								const height = 40;

								return (
									<g transform={`translate(${x},${y})`}>
										<foreignObject x={-width} y={-height / 2} width={width} height={height}>
											<div className="flex h-full items-center">
												<button
													type="button"
													onClick={() => {
														if (user?.id) {
															userOnClick?.(user.id);
														}
													}}
													className="w-full cursor-pointer text-left text-muted-foreground text-sm leading-tight hover:text-white"
												>
													{payload.value}
												</button>
											</div>
										</foreignObject>
									</g>
								);
							}}
						/>
						<ThresholdLine x={warningThresholdLine} dangerLevel="warning" />
						<ThresholdLine x={dangerThresholdLine} dangerLevel="danger" />
						<ChartTooltip
							cursor={false}
							content={({ active, payload, label }) => {
								if (!(active && payload?.length)) {
									return null;
								}

								const avg = payload[0]?.payload?.percent;
								const peak = payload[0]?.payload?.peakPercent;

								return (
									<div className="grid min-w-[8rem] gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
										<div className="font-medium">{label}</div>
										<div className="flex items-center justify-between gap-2">
											<span className="text-muted-foreground">
												{t(($) => $.measurement.average)}
											</span>
											<span className="font-medium font-mono text-foreground tabular-nums">
												{`${avg}%`}
											</span>
										</div>
										{peak != null && (
											<div className="flex items-center justify-between gap-2">
												<span className="text-muted-foreground">
													{t(($) => $.measurement.peak)}
												</span>
												<span className="font-medium font-mono tabular-nums">{`${peak}%`}</span>
											</div>
										)}
									</div>
								);
							}}
						/>
						<Bar dataKey="safe" stackId="risk" fill="var(--safe)" onClick={barOnClick} />
						<Bar dataKey="warning" stackId="risk" fill="var(--warning)" onClick={barOnClick} />
						<Bar dataKey="danger" stackId="risk" fill="var(--danger)" onClick={barOnClick} />
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
