import { TrendLineChart } from "@/components/exposure-line-chart/trend-line-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sensorQueryOptions } from "@/lib/api";
import { buildSensorQuery } from "@/lib/sensor-query-utils";
import type { SensorUnit } from "@/lib/sensors";
import { computeYAxisRange } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useDate } from "../date-picker/use-date";
import { useUser } from "../user/user-context";
import { useView } from "../views/use-view";

interface Props {
	unit: SensorUnit;
}

export function DustTrendLineChartCard({ unit }: Props) {
	const { date } = useDate();
	const { view } = useView();
	const { user } = useUser();

	const sensor = "dust";

	const { data: maxPm1Result } = useQuery(
		sensorQueryOptions({
			sensor,
			query: buildSensorQuery(sensor, view, date, {
				field: "pm1_twa",
				aggregationFunction: "max",
				granularity: "day",
			}),
			userId: user.id,
			enabled: view !== "day",
		}),
	);

	const { data: maxPm4Result } = useQuery(
		sensorQueryOptions({
			sensor,
			query: buildSensorQuery(sensor, view, date, {
				field: "pm4_twa",
				aggregationFunction: "max",
				granularity: "day",
			}),
			userId: user.id,
			enabled: view !== "day",
		}),
	);

	const { data: maxPm25Result } = useQuery(
		//TODO: Switch 2500 instead of 25, same for the other ones
		sensorQueryOptions({
			sensor,
			query: buildSensorQuery(sensor, view, date, {
				field: "pm25_twa",
				aggregationFunction: "max",
				granularity: "day",
			}),
			userId: user.id,
			enabled: view !== "day",
		}),
	);

	const { data: maxPm10Result } = useQuery(
		sensorQueryOptions({
			sensor,
			query: buildSensorQuery(sensor, view, date, {
				field: "pm10_twa",
				aggregationFunction: "max",
				granularity: "day",
			}),
			userId: user.id,
			enabled: view !== "day",
		}),
	);

	const maxPm1Data = maxPm1Result?.data ?? [];
	const maxPm25Data = maxPm25Result?.data ?? [];
	const maxPm10Data = maxPm10Result?.data ?? [];

	const allData = [...maxPm1Data, ...maxPm25Data, ...maxPm10Data];

	const maxValue = Math.max(...allData.map((d) => d.value));

	// TODO: we should compute maxY from sensor in a utils that also has the default maxY for every sensor
	const minY = 0;
	const baseMaxY = 45;
	const maxY = maxValue > baseMaxY ? computeYAxisRange(allData).maxY : baseMaxY;

	const granularity = view === "week" ? "day" : "week";

	return (
		<Card>
			<CardHeader>
				<CardTitle>Trend</CardTitle>
			</CardHeader>
			<CardContent>
				<TrendLineChart
					selectedDate={date}
					granularity={granularity}
					unit={unit}
					minY={minY}
					maxY={maxY}
					series={[
						{
							data: maxPm1Result?.data ?? [],
							sensor,
							sensorField: "pm1_twa",
						},
						{
							data: maxPm4Result?.data ?? [],
							sensor,
							sensorField: "pm4_twa",
						},
						{
							data: maxPm25Result?.data ?? [],
							sensor,
							sensorField: "pm25_twa",
						},
						{
							data: maxPm10Result?.data ?? [],
							sensor,
							sensorField: "pm10_twa",
						},
					]}
				/>
			</CardContent>
		</Card>
	);
}
