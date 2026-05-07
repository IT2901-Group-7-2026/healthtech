import { TrendLineChart } from "@/components/exposure-trend-line-chart/trend-line-chart.tsx";
import { exposureQueryOptions } from "@/lib/api.ts";
import { buildExposureQuery } from "@/lib/exposure-query-utils.ts";
import { computeYAxisRange } from "@/lib/utils.ts";
import { useQuery } from "@tanstack/react-query";
import { useDate } from "../date-picker/use-date.ts";
import { useUser } from "../user/user-context.tsx";
import { useView } from "../views/use-view.ts";
import { BaseTrendLineChartCard } from "./base-trend-line-chart-card.tsx";
import { toWeeklyMax } from "./trend-line-chart-utils.ts";

interface Props {
	userId?: string;
}

export function VibrationTrendLineChartCard({ userId }: Props) {
	const { date } = useDate();
	const { view } = useView();
	const { user } = useUser();

	const exposure = "vibration";

	const query = buildExposureQuery(exposure, view, date);

	const { data: response } = useQuery(
		exposureQueryOptions({
			exposure,
			query,
			userId: userId ?? user.id,
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
						exposure: exposure,
					},
				]}
			/>
		</BaseTrendLineChartCard>
	);
}
