"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import type { Sensor } from "@/features/sensor-picker/sensors";
import type { UserWithStatusDto } from "@/lib/dto";
import { thresholds } from "@/lib/thresholds";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import {
	Bar,
	BarChart,
	type BarProps,
	CartesianGrid,
	ReferenceLine,
	XAxis,
	YAxis,
} from "recharts";

interface Props {
	users: UserWithStatusDto[];
	sensor: Sensor;
	userOnClick?: (userId: string) => void;
}

export function UserStatusChart({ users, sensor, userOnClick }: Props) {
	const [t] = useTranslation();
	const threshold = thresholds[sensor];

	const data = users.flatMap((user) => {
		const sensorStatus = user.status[sensor];
		if (!sensorStatus) {
			return [];
		}

		const percent = Math.round((sensorStatus.value / threshold.danger) * 100);
		// TODO: shoulndn't have peak value if it is lower than avg value
		const peakPercent = sensorStatus.peakValue
			? Math.round((sensorStatus.peakValue / threshold.danger) * 100)
			: null;

		return [
			{
				name: user.username,
				id: user.id,
				status: sensorStatus.level,
				percent,
				peakPercent,
			},
		];
	});

	const warningThresholdLine = (threshold.warning / threshold.danger) * 100;
	const dangerThresholdLine = 100;

	const sortedData = [...data].sort((a, b) => b.percent - a.percent);

	// Split percent into three parts for the stacked bar chart
	const chartData = sortedData.map((item) => ({
		...item,
		safe: Math.min(item.percent, warningThresholdLine),
		warning: Math.min(
			Math.max(item.percent - warningThresholdLine, 0),
			dangerThresholdLine - warningThresholdLine,
		),
		danger: Math.max(item.percent - dangerThresholdLine, 0),
		userId: item.id,
		peakMarker:
			item.peakPercent != null
				? Math.max(item.peakPercent - item.percent, 0)
				: 0,
	}));

	const maxPercent = Math.max(
		100,
		...chartData.map((item) => item.percent),
		...chartData.map((item) => item.peakPercent ?? 0),
	);
	const xDomainPadding = 15;
	const xDomainMax = maxPercent + xDomainPadding;

	const barOnClick: BarProps["onClick"] = (data) => {
		const row = data.payload;
		userOnClick?.(row.id);
	};

	// One tick per 25%
	const xTicks = Array.from(
		{ length: Math.ceil(xDomainMax / 25) + 1 },
		(_, i) => i * 25,
	);

	return (
		<Card className="w-192 py-0">
			<CardContent className="px-2 sm:p-6">
				<div className="mb-3 flex items-center gap-6 text-xs text-muted-foreground">
					<div className="flex items-center gap-2">
						<div className="h-3 w-6 rounded-sm bg-[var(--safe)]" />
						<span>Safe</span>
					</div>

					<div className="flex items-center gap-2">
						<div className="h-3 w-6 rounded-sm bg-[var(--warning)]" />
						<span>Warning</span>
					</div>

					<div className="flex items-center gap-2">
						<div className="h-3 w-6 rounded-sm bg-[var(--danger)]" />
						<span>Danger</span>
					</div>

					<div className="flex items-center gap-2">
						<div className="relative h-3 w-6">
							<div className="absolute left-0 right-1 top-1/2 h-[2px] -translate-y-1/2 bg-[var(--danger)]" />
							<div className="absolute right-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full border-2 border-[var(--danger)] bg-background" />
						</div>
						<span>Peak</span>
					</div>
				</div>
				<ChartContainer config={{}} className="aspect-auto h-[520px] w-full">
					<BarChart
						accessibilityLayer
						layout="vertical"
						data={chartData}
						margin={{
							top: 28,
							left: 12,
							right: 20,
							bottom: 32,
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
								offset: -20,
							}}
						/>
						<YAxis
							type="category"
							dataKey="name"
							tickLine={false}
							axisLine={false}
							width={90}
							tickFormatter={(v) => `${v}`}
						/>
						<ReferenceLine
							x={warningThresholdLine}
							stroke="hsl(var(--background))"
							strokeWidth={6}
						/>
						<ReferenceLine
							x={warningThresholdLine}
							stroke="var(--warning)"
							strokeDasharray="6 4"
							strokeWidth={2}
							label={{
								value: "Warning",
								position: "top",
								fill: "var(--warning)",
							}}
						/>
						<ReferenceLine
							x={dangerThresholdLine}
							stroke="hsl(var(--background))"
							strokeWidth={6}
						/>
						<ReferenceLine
							x={dangerThresholdLine}
							stroke="var(--danger)"
							strokeDasharray="6 4"
							strokeWidth={2}
							label={{
								value: "Danger",
								position: "top",
								fill: "var(--danger)",
							}}
						/>
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
											<span className="text-muted-foreground">{"Total"}</span>
											<span className="font-medium font-mono text-foreground tabular-nums">
												{`${avg}%`}
											</span>
										</div>
										{peak != null && (
											<div className="flex items-center justify-between gap-2">
												<span className="text-muted-foreground">Peak</span>
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
							className={cn(userOnClick && "hover:cursor-pointer")}
							onClick={barOnClick}
						/>
						<Bar
							dataKey="warning"
							stackId="risk"
							fill="var(--warning)"
							className={cn(userOnClick && "hover:cursor-pointer")}
							onClick={barOnClick}
						/>
						<Bar
							dataKey="danger"
							stackId="risk"
							fill="var(--danger)"
							className={cn(userOnClick && "hover:cursor-pointer")}
							onClick={barOnClick}
						/>
						<Bar
							dataKey="peakMarker"
							stackId="risk"
							fill="transparent"
							fillOpacity={0}
							shape={({ x, y, width, height }) => {
								if (!width || width <= 0) return null;

								const yMid = y + height / 2;
								const xStart = x;
								const xEnd = x + width;

								const stroke = "var(--danger)";
								const r = Math.min(6, height * 0.22);

								return (
									<g>
										<line
											x1={xStart}
											y1={yMid}
											x2={xEnd - r}
											y2={yMid}
											stroke={stroke}
											strokeWidth={2}
											strokeLinecap="round"
										/>

										<circle
											cx={xEnd}
											cy={yMid}
											r={r}
											fill="transparent"
											stroke={stroke}
											strokeWidth={2}
										/>
									</g>
								);
							}}
							className={cn(userOnClick && "hover:cursor-pointer")}
							onClick={barOnClick}
						/>
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
