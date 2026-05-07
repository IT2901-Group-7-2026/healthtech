import { TrendLineChart } from "@/components/exposure-trend-line-chart/trend-line-chart";
import { exposureQueryOptions } from "@/lib/api";
import type { ExposureTypeField } from "@/lib/dto/exposure";
import { buildExposureQuery } from "@/lib/exposure-query-utils";
import type { ExposureUnit } from "@/lib/exposures";
import { computeYAxisRange, DUST_Y_AXIS_STEP } from "@/lib/utils";
import { useQueries } from "@tanstack/react-query";
import { useDate } from "../date-picker/use-date";
import { useUser } from "../user/user-context";
import { useView } from "../views/use-view";
import { BaseTrendLineChartCard } from "./base-trend-line-chart-card";
import { toWeeklyMax } from "./trend-line-chart-utils";

interface Props {
	unit: ExposureUnit;
	userId?: string;
}

export function DustTrendLineChartCard({ unit, userId }: Props) {
	const { date } = useDate();
	const { view } = useView();
	const { user } = useUser();

	const exposure = "dust";

	//TODO: Switch 2500 instead of 25, same for the other ones
	const dustFieldsToQuery: Array<ExposureTypeField> = ["pm1_twa", "pm25_twa", "pm4_twa", "pm10_twa"];

	const queriesEnabled = view !== "day";

	const queryOptions = dustFieldsToQuery.map((field) =>
		exposureQueryOptions({
			exposure,
			query: buildExposureQuery(exposure, view, date, {
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

	// TODO: we should compute maxY from exposure in a utils that also has the default maxY for every exposure
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
						exposure,
						exposureField: "pm1_twa",
					},
					{
						data: pm4Data,
						exposure,
						exposureField: "pm4_twa",
					},
					{
						data: pm25Data,
						exposure,
						exposureField: "pm25_twa",
					},
					{
						data: pm10Data,
						exposure,
						exposureField: "pm10_twa",
					},
				]}
			/>
		</BaseTrendLineChartCard>
	);
}
