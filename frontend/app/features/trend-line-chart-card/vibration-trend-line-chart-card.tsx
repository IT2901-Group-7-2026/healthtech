import { TrendLineChart } from "@/components/exposure-trend-line-chart/trend-line-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sensorQueryOptions } from "@/lib/api";
import { buildSensorQuery } from "@/lib/sensor-query-utils";
import { computeYAxisRange } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useDate } from "../date-picker/use-date";
import { useUser } from "../user/user-context";
import { useView } from "../views/use-view";

export function VibrationTrendLineChartCard() {
	const { date } = useDate();
	const { view } = useView();
	const { user } = useUser();
	const { t } = useTranslation();

	const sensor = "vibration";

	const query = buildSensorQuery(sensor, view, date);

	const { data: response } = useQuery(
		sensorQueryOptions({
			sensor,
			query,
			userId: user.id,
		}),
	);

	const data = response?.data;

	const maxValue = data ? Math.max(...data.map((d) => d.value)) : 0;

	const minY = 0;
	let maxY = 450;
	if (maxValue > maxY) {
		maxY = computeYAxisRange(data ?? []).maxY;
	}

	const granularity = view === "week" ? "day" : "week";

	return (
		<Card>
			<CardHeader>
				<CardTitle>
					{t(($) => $.exposureTrendLineChartCard.title, {
						view: t(($) => $.views[view]).toLowerCase(),
					})}
				</CardTitle>
			</CardHeader>
			<CardContent>
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
			</CardContent>
		</Card>
	);
}
