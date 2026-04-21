import { TrendLineChart } from "@/components/exposure-trend-line-chart/trend-line-chart";
import { sensorQueryOptions } from "@/lib/api";
import { buildSensorQuery } from "@/lib/sensor-query-utils";
import { computeYAxisRange } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useDate } from "../date-picker/use-date";
import { useUser } from "../user/user-context";
import { useView } from "../views/use-view";
import { BaseTrendLineChartCard } from "./base-trend-line-chart-card";
import { toWeeklyMax } from "./trend-line-chart-utils";

export function VibrationTrendLineChartCard() {
	const { date } = useDate();
	const { view } = useView();
	const { user } = useUser();

	const sensor = "vibration";

	const query = buildSensorQuery(sensor, view, date);

	const { data: response } = useQuery(
		sensorQueryOptions({
			sensor,
			query,
			userId: user.id,
		}),
	);

	const granularity = view === "week" ? "day" : "week";

	const data = granularity === "week" ? toWeeklyMax(response?.data ?? []) : response?.data;

	const maxValue = data ? Math.max(...data.map((d) => d.value)) : 0;

	const minY = 0;
	let maxY = 450;
	if (maxValue > maxY) {
		maxY = computeYAxisRange(data ?? []).maxY;
	}

	return (
		<BaseTrendLineChartCard>
			<TrendLineChart
				selectedDate={date}
				granularity={granularity}
				unit="points"
				minY={minY}
				maxY={maxY}
				series={[
					{
						data: data ?? [],
						sensor: sensor,
					},
				]}
			/>
		</BaseTrendLineChartCard>
	);
}
