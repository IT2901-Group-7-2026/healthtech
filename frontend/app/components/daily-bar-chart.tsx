"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";
import { useDate } from "@/features/date-picker/use-date";
import type { Sensor } from "@/features/sensor-picker/sensors";
import { sensors } from "@/features/sensor-picker/sensors";
import { useFormatDate } from "@/hooks/use-format-date";
import type { OverviewChartRow } from "@/lib/time-bucket-types";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Bar, BarChart, Cell, XAxis, YAxis } from "recharts";

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
	const formatDate = useFormatDate();

	const totalHours = endHour - startHour + 1;
	const hours = Array.from({ length: totalHours }, (_, i) => startHour + i);

	const chartData = generateChartData(startHour, endHour);

	const utcOffsetHours = useMemo(() => {
		const utcNoon = new Date(
			Date.UTC(
				date.getFullYear(),
				date.getMonth(),
				date.getDate(),
				12,
				0,
				0,
				0,
			),
		);

		return Number(formatDate(utcNoon, "H")) - 12;
	}, [date, formatDate]);

	// Empty hour blocks
	const chartConfig: ChartConfig = Object.fromEntries(
		hours.map((hour) => [
			hour.toString(),
			{
				label: `${String(hour).padStart(2, "0")}:00`,
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

	const formatTime = (value: number) => {
		const hour = (startHour + value / HOUR_BLOCK_SIZE) % 24;
		return `${String(hour).padStart(2, "0")}:00`;
	};

	return (
		<Card className="w-full">
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle className="text-base">{chartTitle}</CardTitle>
				{headerRight}
			</CardHeader>

			<CardContent>
				<ChartContainer config={chartConfig} className="h-100">
					<BarChart data={chartData} layout="vertical">
						<XAxis
							type="number"
							domain={[0, domainMax]}
							ticks={ticks}
							tickFormatter={formatTime}
							tick={{
								className: "text-base",
								fill: "var(--color-muted-foreground)",
								dy: 4,
							}}
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
							tick={{
								className: "text-base",
								fill: "var(--color-muted-foreground)",
							}}
						/>

						{hourKeys.map((key) => (
							<Bar
								key={key}
								dataKey={key}
								stackId="a"
								stroke="var(--muted-foreground)"
								strokeWidth={1}
								barSize={80}
							>
								{data.map((row, index) => {
									const localHour = Number(key);
									const utcHour =
										(((localHour - utcOffsetHours) % 24) +
											24) %
										24;
									const dangerLevel =
										row.dangerLevelByHour[utcHour];
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
													search: `?view=Day&date=${formatDate(date, "yyyy-MM-dd")}`,
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
