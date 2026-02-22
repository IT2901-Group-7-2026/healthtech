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
	users: Array<UserWithStatusDto>;
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

		const percent = Math.round(
			(sensorStatus.value / threshold.danger) * 100,
		);
		// Only show peak if it's above the current value
		const peakPercent =
			sensorStatus.peakValue &&
			sensorStatus.peakValue > sensorStatus.value
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

	if (data.length === 0) {
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
	}));

	const maxPercent = Math.max(100, ...chartData.map((item) => item.percent));
	const xDomainPadding = 15;
	const xDomainMax = maxPercent + xDomainPadding;

	const barOnClick: BarProps["onClick"] = (barData) => {
		const row = barData.payload;
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
				<ChartContainer config={{}} className="aspect-auto h-[520px] w-full">
					<BarChart
						accessibilityLayer
						layout="vertical"
						data={chartData}
						margin={{
							bottom: 32,
							top: 24,
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
							stroke="var(--warning)"
							strokeDasharray="6 4"
							strokeWidth={2}
							label={{
								value: t(($) => $.warning),
								position: "insideTopRight",
								dy: -16,
								fill: "var(--warning)",
							}}
						/>
						<ReferenceLine
							x={dangerThresholdLine}
							stroke="var(--danger)"
							strokeDasharray="6 4"
							strokeWidth={2}
							label={{
								value: t(($) => $.danger),
								position: "insideTopLeft",
								dy: -16,
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
											<span className="text-muted-foreground">
												{t(($) => $.average)}
											</span>
											<span className="font-medium font-mono text-foreground tabular-nums">
												{`${avg}%`}
											</span>
										</div>
										{peak != null && (
											<div className="flex items-center justify-between gap-2">
												<span className="text-muted-foreground">
													{t(($) => $.peak)}
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
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
