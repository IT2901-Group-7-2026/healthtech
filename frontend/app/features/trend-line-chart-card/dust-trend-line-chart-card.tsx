import { TrendLineChart } from "@/components/exposure-trend-line-chart/trend-line-chart";
import { sensorQueryOptions } from "@/lib/api";
import type { SensorTypeField } from "@/lib/dto";
import { buildSensorQuery } from "@/lib/sensor-query-utils";
import type { SensorUnit } from "@/lib/sensors";
import { computeYAxisRange, DUST_Y_AXIS_STEP } from "@/lib/utils";
import { useQueries } from "@tanstack/react-query";
import { useDate } from "../date-picker/use-date";
import { useUser } from "../user/user-context";
import { useView } from "../views/use-view";
import { BaseTrendLineChartCard } from "./base-trend-line-chart-card";
import { toWeeklyMax } from "./trend-line-chart-utils";

interface Props {
	unit: SensorUnit;
	userId?: string;
}

export function DustTrendLineChartCard({ unit, userId }: Props) {
	const { date } = useDate();
	const { view } = useView();
	const { user } = useUser();

	const sensor = "dust";

	//TODO: Switch 2500 instead of 25, same for the other ones
	const dustFieldsToQuery: Array<SensorTypeField> = ["pm1_twa", "pm4_twa", "pm25_twa", "pm10_twa"];

	const queriesEnabled = view !== "day";

	const queryOptions = dustFieldsToQuery.map((field) =>
		sensorQueryOptions({
			sensor,
			query: buildSensorQuery(sensor, view, date, {
				field,
				aggregationFunction: "max",
				granularity: "day",
			}),
			userId: userId ?? user.id,
			enabled: queriesEnabled,
		}),
	);

	const queryResults = useQueries({ queries: queryOptions });

	const maxPm1Data = queryResults[0]?.data?.data ?? [];
	const maxPm4Data = queryResults[1]?.data?.data ?? [];
	const maxPm25Data = queryResults[2]?.data?.data ?? [];
	const maxPm10Data = queryResults[3]?.data?.data ?? [];

	const granularity = view === "week" ? "day" : "week";

	const pm1Data = granularity === "week" ? toWeeklyMax(maxPm1Data) : maxPm1Data;
	const pm4Data = granularity === "week" ? toWeeklyMax(maxPm4Data) : maxPm4Data;
	const pm25Data = granularity === "week" ? toWeeklyMax(maxPm25Data) : maxPm25Data;
	const pm10Data = granularity === "week" ? toWeeklyMax(maxPm10Data) : maxPm10Data;

	const allData = [...pm1Data, ...pm4Data, ...pm25Data, ...pm10Data];

	const maxValue = Math.max(...allData.map((d) => d.value));

	// TODO: we should compute maxY from sensor in a utils that also has the default maxY for every sensor
	const minY = 0;
	const baseMaxY = 45;
	const maxY =
		maxValue > baseMaxY
			? computeYAxisRange(allData, { step: DUST_Y_AXIS_STEP, topPadding: DUST_Y_AXIS_STEP }).maxY
			: baseMaxY;

	return (
		<BaseTrendLineChartCard>
			<TrendLineChart
				selectedDate={date}
				granularity={granularity}
				unit={unit}
				minY={minY}
				maxY={maxY}
				series={[
					{
						data: pm1Data,
						sensor,
						sensorField: "pm1_twa",
					},
					{
						data: pm4Data,
						sensor,
						sensorField: "pm4_twa",
					},
					{
						data: pm25Data,
						sensor,
						sensorField: "pm25_twa",
					},
					{
						data: pm10Data,
						sensor,
						sensorField: "pm10_twa",
					},
				]}
			/>
		</BaseTrendLineChartCard>
	);
}
