"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import type { Exposure } from "@/features/exposure-picker/exposures";
import { type DangerLevel, DangerLevelSchema, DangerLevels } from "@/lib/danger-levels";
import type { UserWithStatusDto } from "@/lib/dto";
import { getThreshold } from "@/lib/thresholds";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { Bar, BarChart, type BarProps, CartesianGrid, Legend, Rectangle, XAxis, YAxis } from "recharts";
import { ThresholdLegend } from "./exposure-line-chart/threshold-legend";
import { ThresholdLine } from "./exposure-line-chart/threshold-line";

const OUTER_BAR_RADIUS = 4;
const LEFT_BAR_RADIUS = 0;

interface Props {
	users: Array<UserWithStatusDto>;
	exposure: Exposure;
	userOnClick?: (userId: string) => void;
	isWeekly?: boolean;
}

export function UserStatusChart({ users, exposure, userOnClick, isWeekly }: Props) {
	const [t] = useTranslation();
	const threshold = getThreshold(exposure);
	const getPercent = (value: number) => Math.round((value / threshold.danger) * 100);

	const hasAnyExposureData = users.some((u) => {
		const exposureStatus = u.status[exposure];
		if (!exposureStatus) return false;

		return getPercent(exposureStatus.value) >= 1;
	});

	const data = users.flatMap((user) => {
		const exposureStatus = user.status[exposure];
		if (!exposureStatus) {
			return [];
		}

		const days = isWeekly ? 7 : 1;

		// Vibration should show average value in graph
		const normalizedValue = exposure === "vibration" ? exposureStatus.value / days : exposureStatus.value;

		const percent = getPercent(normalizedValue);
		// Only show peak if it's above the current value
		const peakPercent =
			exposureStatus.peakValue && exposureStatus.peakValue > exposureStatus.value
				? getPercent(exposureStatus.peakValue)
				: null;

		return [
			{
				name: user.name,
				id: user.id,
				status: exposureStatus.dangerLevel,
				percent,
				peakPercent,
			},
		];
	});

	if (!hasAnyExposureData) {
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

	type ChartDataEntry = (typeof chartData)[number];

	const getSegmentRadius = (item: ChartDataEntry, key: DangerLevel): [number, number, number, number] => {
		if (item[key] <= 0) {
			return [0, 0, 0, 0];
		}

		const visibleSegments = DangerLevelSchema.options.filter((level) => item[level] > 0);
		const isFirstVisibleSegment = visibleSegments[0] === key;
		const isLastVisibleSegment = visibleSegments.at(-1) === key;

		return [
			isFirstVisibleSegment ? LEFT_BAR_RADIUS : 0,
			isLastVisibleSegment ? OUTER_BAR_RADIUS : 0,
			isLastVisibleSegment ? OUTER_BAR_RADIUS : 0,
			isFirstVisibleSegment ? LEFT_BAR_RADIUS : 0,
		];
	};

	const renderBarSegment =
		(key: DangerLevel) => (props: ComponentProps<typeof Rectangle> & { payload?: ChartDataEntry }) => {
			if (!props.payload) {
				return null;
			}

			return <Rectangle {...props} radius={getSegmentRadius(props.payload, key)} />;
		};

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
							bottom: 24,
							top: 12,
							left: 12,
							right: 12,
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
								offset: -12,
								className: "text-xs",
								fill: "var(--color-muted-foreground)",
							}}
							tick={{
								className: "text-xs",
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
						<Bar
							dataKey="safe"
							stackId="risk"
							fill="var(--safe)"
							onClick={barOnClick}
							shape={renderBarSegment("safe")}
						/>
						<Bar
							dataKey="warning"
							stackId="risk"
							fill="var(--warning)"
							onClick={barOnClick}
							shape={renderBarSegment("warning")}
						/>
						<Bar
							dataKey="danger"
							stackId="risk"
							fill="var(--danger)"
							onClick={barOnClick}
							shape={renderBarSegment("danger")}
						/>
						<Legend
							verticalAlign="bottom"
							align="left"
							wrapperStyle={{ bottom: 0 }}
							content={() => (
								<div style={{ marginLeft: 120 }}>
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
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
