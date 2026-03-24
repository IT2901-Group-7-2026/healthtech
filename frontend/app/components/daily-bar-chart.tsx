"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";
import { useDate } from "@/features/date-picker/use-date";
import type { Sensor } from "@/features/sensor-picker/sensors";
import { sensors } from "@/features/sensor-picker/sensors";
import type { OverviewChartRow } from "@/lib/time-bucket-types";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

const HOUR_BLOCK_SIZE = 10;

// Creates a record per sensor, where each record contains a key for each hour in the day and the size of the block to render
function generateChartData(
	startHour: number,
	endHour: number,
): Array<Record<string, string>> {
	const hourEntries = Array.from(
		{ length: endHour - startHour + 1 },
		(_, i) => [String(startHour + i), HOUR_BLOCK_SIZE],
	);

	const hourData = Object.fromEntries(hourEntries);

	return sensors.map((sensor) => ({
		sensor,
		...hourData,
	}));
}

interface DailyBarChartProps {
	data: Array<OverviewChartRow>;
	chartTitle: string;
	startHour?: number;
	endHour?: number;
	headerRight?: React.ReactNode;
}

export function DailyBarChart({
	data,
	chartTitle,
	startHour = 0,
	endHour = 23,
	headerRight,
}: DailyBarChartProps) {
	const { t } = useTranslation();
	const { date } = useDate();
	const navigate = useNavigate();

	const totalHours = endHour - startHour + 1;
	const hours = Array.from({ length: totalHours }, (_, i) => startHour + i);

	const chartData = generateChartData(startHour, endHour);

	// Empty hour blocks
	const chartConfig: ChartConfig = Object.fromEntries(
		hours.map((hour) => [
			hour.toString(),
			{
				label: `${hour}:00`,
				color: "var(--card)",
			},
		]),
	);

	const hourKeys = hours.map(String);
	const domainMax = totalHours * HOUR_BLOCK_SIZE;
	const ticks = Array.from(
		{ length: totalHours + 1 },
		(_, i) => i * HOUR_BLOCK_SIZE,
	);

	return (
		<Card className="w-full">
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle>{chartTitle}</CardTitle>
				{headerRight}
			</CardHeader>

			<CardContent>
				<ChartContainer config={chartConfig} className="h-100">
					<BarChart data={chartData} layout="vertical">
						  <CartesianGrid
							stroke="var(--muted-foreground)"
							strokeDasharray="2 5"
							vertical={true}
							horizontal={false}
						/>
						<XAxis
							type="number"
							domain={[0, domainMax]}
							ticks={ticks}
							tickFormatter={(value) =>
								`${startHour + value / HOUR_BLOCK_SIZE}:00`
							}
						/>
						<YAxis
							dataKey="sensor"
							type="category"
							tickLine={false}
							axisLine={false}
							width={80}
							tickFormatter={(value) =>
								t(($) => $.overview[value as Sensor])
							}
						/>

						{hourKeys.map((key) => (
							<Bar
								key={key}
								dataKey={key}
								stackId="a"
								stroke="var(--muted-foreground)"
								strokeWidth={1}
								barSize={20}
								radius={50}
							>
								{data.map((row, index) => {
									const hour = Number(key);
									const dangerLevel =
										row.dangerLevelByHour[hour];
									let color = chartConfig[key].color;

									if (dangerLevel === "danger") {
										color = "var(--danger)";
									} else if (dangerLevel === "warning") {
										color = "var(--warning)";
									} else if (dangerLevel === "safe") {
										color = "var(--safe)";
									}

									if (color === "var(--card)") {
										return (
											<Cell
												key={`cell-${index}-${key}`}
												fill={color}
											/>
										);
									}

									return (
										<Cell
											key={`cell-${index}-${key}`}
											fill={color}
											className="cursor-pointer hover:brightness-90 active:brightness-90"
											onClick={() =>
												navigate({
													pathname: row.sensor,
													search: `?view=Day&date=${date.toISOString().split("T")[0]}`,
												})
											}
										/>
									);
								})}
							</Bar>
						))}
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
