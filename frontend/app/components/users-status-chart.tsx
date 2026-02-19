"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
} from "@/components/ui/chart";
import {
	Bar,
	BarChart,
	CartesianGrid,
	ReferenceLine,
	XAxis,
	YAxis,
} from "recharts";

const rawChartData = [
	{
		name: "Bjarne",
		percent: 12,
		status: "safe",
	},
	{
		name: "Ada",
		percent: 45,
		status: "warning",
	},
	{
		name: "Grace",
		percent: 78,
		status: "danger",
	},
	{
		name: "Alan",
		percent: 34,
		status: "warning",
	},
	{
		name: "Margaret",
		percent: 110,
		status: "safe",
	},
	{
		name: "Linus",
		percent: 28,
		status: "safe",
	},
	{
		name: "Katherine",
		percent: 63,
		status: "warning",
	},
	{
		name: "Tim",
		percent: 87,
		status: "danger",
	},
	{
		name: "Hedy",
		percent: 41,
		status: "warning",
	},
	{
		name: "Dennis",
		percent: 19,
		status: "safe",
	},
	{
		name: "James",
		percent: 74,
		status: "warning",
	},
	{
		name: "Barbara",
		percent: 95,
		status: "danger",
	},
	{
		name: "Donald",
		percent: 52,
		status: "warning",
	},
	{
		name: "Ken",
		percent: 33,
		status: "safe",
	},
	{
		name: "Frances",
		percent: 81,
		status: "danger",
	},
	{
		name: "Edsger",
		percent: 67,
		status: "warning",
	},
	{
		name: "Guido",
		percent: 22,
		status: "safe",
	},
	{
		name: "Anders",
		percent: 58,
		status: "warning",
	},
	{
		name: "Brendan",
		percent: 99,
		status: "danger",
	},
	{
		name: "John",
		percent: 46,
		status: "warning",
	},
];

const chartConfig = {
	percent: {
		label: "Percent", //TODO: i18n
	},
	safe: {
		label: "Safe", //TODO: i18n
		color: "var(--safe)",
	},
	warning: {
		label: "Warning", //TODO: i18n
		color: "var(--warning)",
	},
	danger: {
		label: "Danger", //TODO: i18n
		color: "var(--danger)",
	},
} satisfies ChartConfig;

export function UserStatusChart() {
	const warningThreshold = 40;
	const dangerThreshold = 80;

	const data = [...rawChartData].sort((a, b) => b.percent - a.percent);

	const chartData = data.map((item) => ({
		...item,
		safe: Math.min(item.percent, 40),
		warning: Math.min(Math.max(item.percent - 40, 0), 40),
		danger: Math.max(item.percent - 80, 0),
	}));

	return (
		<Card className="w-192 py-0">
			<CardContent className="px-2 sm:p-6">
				<ChartContainer
					config={chartConfig}
					className="aspect-auto h-[520px] w-full"
				>
					<BarChart
						accessibilityLayer
						layout="vertical"
						data={chartData}
						margin={{
							left: 12,
							right: 12,
						}}
					>
						<CartesianGrid horizontal={false} />
						<XAxis
							type="number"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							domain={[
								0,
								Math.max(
									100,
									...chartData.map((d) => d.percent),
								),
							]}
							tickFormatter={(v) => `${v}%`}
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
							x={warningThreshold}
							stroke="var(--warning)"
							strokeDasharray="4 4"
							label={{
								value: "Warning",
								position: "insideTopRight",
								fill: "var(--warning)",
							}}
						/>
						<ReferenceLine
							x={dangerThreshold}
							stroke="var(--danger)"
							strokeDasharray="4 4"
							label={{
								value: "Danger",
								position: "insideTopRight",
								fill: "var(--danger)",
							}}
						/>
						<ChartTooltip
							content={({ active, payload, label }) => {
								if (!(active && payload?.length)) {
									return null;
								}

								const total = payload[0]?.payload?.percent;

								return (
									<div className="grid min-w-[8rem] gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
										<div className="font-medium">
											{label}
										</div>
										<div className="flex items-center justify-between gap-2">
											<span className="text-muted-foreground">
												Total
											</span>
											<span className="font-medium font-mono text-foreground tabular-nums">
												{`${total}%`}
											</span>
										</div>
									</div>
								);
							}}
						/>
						<Bar dataKey="safe" stackId="risk" fill="var(--safe)" />
						<Bar
							dataKey="warning"
							stackId="risk"
							fill="var(--warning)"
						/>
						<Bar
							dataKey="danger"
							stackId="risk"
							fill="var(--danger)"
						/>
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
