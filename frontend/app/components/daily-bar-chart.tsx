"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";
import { useDate } from "@/features/date-picker/use-date";
import type { Sensor } from "@/features/sensor-picker/sensors";
import { sensors } from "@/features/sensor-picker/sensors";
import type { AllSensors } from "@/lib/dto";
import { thresholds } from "@/lib/thresholds";
import { makeCumulative } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Bar, BarChart, Cell, XAxis, YAxis } from "recharts";

// the chart data is always the same, we only change the colors based on exposure data
const generateChartData = (): Array<Record<string, Sensor>> =>
	sensors.map((sensor) => ({
		sensor,
		...Object.fromEntries(
			Array.from({ length: 24 }, (_, h) => [h.toString(), 10]),
		),
	}));

function aggregateHourlyMax(data: AllSensors): Record<Sensor, Array<number>> {
	const _data = {
		dust: data.dust,
		vibration: {
			data: makeCumulative(data.vibration.data ?? []),
			isLoading: data.vibration.isLoading,
			isError: data.vibration.isError,
		},
		noise: data.noise,
	};
	const result = {} as Record<Sensor, Array<number>>;

	(Object.keys(_data) as Array<Sensor>).forEach((sensor) => {
		const sensorData = _data[sensor].data ?? [];
		const hourlyMax = Array(24).fill(-1);

		for (const { time, value } of sensorData) {
			const hour = new Date(time).getUTCHours();
			if (value > hourlyMax[hour]) {
				hourlyMax[hour] = value;
			}
		}

		result[sensor] = hourlyMax;
	});

	return result;
}

export function DailyBarChart({
	data,
	chartTitle,
	startHour = 8,
	endHour = 16,
}: {
	data: AllSensors;
	chartTitle: string;
	startHour?: number;
	endHour?: number;
}) {
	const { t } = useTranslation();
	const { date } = useDate();
	const navigate = useNavigate();
	const totalHours = endHour - startHour + 1;
	const hours = Array.from({ length: totalHours }, (_, i) => startHour + i);

	const hourlyMax = aggregateHourlyMax(data);

	//the default color is var(--card), i.e. same as background
	const chartConfig = Object.fromEntries(
		hours.map((h) => [
			h.toString(),
			{
				label: `${h}:00`,
				color: `var(--card)`,
			},
		]),
	) satisfies ChartConfig;

	const hourKeys = Array.from(
		{ length: endHour - startHour + 1 },
		(_, i) => `${startHour + i}`,
	);
	const domainMax = totalHours * 10;
	const ticks = Array.from({ length: totalHours + 1 }, (_, i) => i * 10);

	return (
		<Card className="w-full">
			<CardHeader>
				<CardTitle>{chartTitle}</CardTitle>
			</CardHeader>
			<CardContent>
				<ChartContainer config={chartConfig}>
					<BarChart data={generateChartData()} layout="vertical">
						<XAxis
							type="number"
							domain={[0, domainMax]}
							ticks={ticks}
							tickFormatter={(value) => `${startHour + value / 10}:00`}
						/>
						<YAxis
							dataKey="sensor"
							type="category"
							tickLine={false}
							axisLine={false}
							width={80}
							tickFormatter={(value) => t(($) => $.overview[value as Sensor])}
						/>
						{hourKeys.map((key) => (
							<Bar
								key={key}
								dataKey={key}
								stackId="a"
								stroke={"var(--muted-foreground)"} // Tailwind + theme aware
								strokeWidth={1}
							>
								{generateChartData().map((entry, index) => {
									const sensor = entry.sensor;
									const _threshold = thresholds[entry.sensor];
									const i = Number(key);

									let color = chartConfig[key].color;
									if (hourlyMax[sensor][i] > _threshold.danger) {
										color = "var(--danger)";
									} else if (hourlyMax[sensor][i] > _threshold.warning) {
										color = "var(--warning)";
									} else if (hourlyMax[sensor][i] > -1) {
										color = "var(--safe)";
									}
									if (color === `var(--card)`) {
										// Non-active cell, No data
										return <Cell key={`cell-${index}-${key}`} fill={color} />;
									}
									return (
										// Active cell, has data, interactable
										<Cell
											onClick={() =>
												navigate({
													pathname: entry.sensor,
													search: `?view=Day&date=${date.toLocaleDateString("en-CA")}`,
												})
											}
											key={`cell-${index}-${key}`}
											fill={color}
											className={
												"cursor-pointer hover:brightness-90 active:brightness-90"
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
