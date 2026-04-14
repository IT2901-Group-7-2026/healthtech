import { ChartLineDefault, ChartLineSkeleton, ThresholdLine } from "@/components/line-chart";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { CalendarWidget } from "@/features/calendar-widget/calendar-widget";
import { useDate } from "@/features/date-picker/use-date";
import { useUser } from "@/features/user/user-context";
import { useView } from "@/features/views/use-view";
import { WeekWidget } from "@/features/week-widget/week-widget";
import { useExportPDF } from "@/hooks/use-export-pdf";
import { sensorQueryOptions } from "@/lib/api";
import { buildSensorQuery } from "@/lib/sensor-query-utils";
import type { Sensor } from "@/lib/sensors";
import { getThreshold } from "@/lib/thresholds";
import { mapSensorDataToTimeBucketStatuses } from "@/lib/time-bucket-utils";
import { computeYAxisRange, downsampleSensorData, getHourDomainFromBuckets } from "@/lib/utils";
import { useQueries } from "@tanstack/react-query";
import { useId } from "react";
import { useTranslation } from "react-i18next";

export default function Dust() {
	const { view } = useView();
	const { date } = useDate();
	const { t, i18n } = useTranslation();
	const locale = i18n.language;
	const { user } = useUser();
	const { exportToPDF } = useExportPDF();
	const chartContainerId = useId();

	const sensor: Sensor = "dust";

	const query = buildSensorQuery(sensor, view, date);

	// Retrieve week data to find the min and max hour the user has data
	const weekHourRangeQuery = buildSensorQuery(sensor, "week", date, {
		granularity: "hour",
	});

	const dustThreshold = getThreshold(sensor, query.field);

	const [dataResult, weekHourRangeResult] = useQueries({
		queries: [
			sensorQueryOptions({
				sensor,
				query,
				userId: user.id,
			}),
			sensorQueryOptions({
				sensor,
				query: weekHourRangeQuery,
				userId: user.id,
			}),
		],
	});

	const { data, isLoading, isError } = dataResult;

	const { minHour, maxHour } = getHourDomainFromBuckets(weekHourRangeResult.data ?? []);

	const maxValue = data ? Math.max(...data.map((d) => d.value)) : 0;

	const minY = 0;
	let maxY = 45;
	if (maxValue > maxY) {
		maxY = computeYAxisRange(data ?? []).maxY;
	}

	const calendarData = mapSensorDataToTimeBucketStatuses(data ?? [], sensor);
	const averageExposure =
		data && data.length > 0 ? data.reduce((sum, current) => sum + current.value, 0) / data.length : 0;

	return (
		<div className="flex flex-1 flex-col gap-4">
			{isLoading ? (
				<ChartLineSkeleton />
			) : isError ? (
				<Card className="flex h-full w-full items-center">
					<p>{t(($) => $.common.error)}</p>
				</Card>
			) : view === "month" ? (
				<CalendarWidget selectedDay={date} data={calendarData} />
			) : view === "week" ? (
				<WeekWidget dayStartHour={minHour} dayEndHour={maxHour} data={calendarData} />
			) : !data || data.length === 0 ? (
				<Card className="flex h-24 w-full items-center">
					<CardTitle>
						{date.toLocaleDateString(locale, {
							day: "numeric",
							month: "long",
							year: "numeric",
						})}
					</CardTitle>
					<p>{t(($) => $.common.noData)}</p>
				</Card>
			) : (
				<div className="w-full">
					<div id={chartContainerId}>
						<ChartLineDefault
							minHour={minHour}
							maxHour={maxHour}
							chartData={downsampleSensorData(sensor, data ?? [])}
							chartTitle={`${t(($) => $.measurement.averageExposure)}: ${Math.trunc(averageExposure)} ${t(($) => $.sensors.dustUnit)}`}
							unit={t(($) => $.sensors.dustUnit)}
							maxY={maxY}
							minY={minY}
							lineType="monotone"
							sensor={sensor}
							dustField={query.field}
							headerRight={
								<Button
									size="sm"
									variant="outline"
									onClick={() =>
										exportToPDF(
											chartContainerId,
											`${date.toLocaleDateString(locale, {
												day: "numeric",
												month: "long",
												year: "numeric",
											})}-${user.username}-Dust-Exposure-Overview`,
											`Dust Exposure - ${user.username} - ${date.toLocaleDateString(locale)}`,
										)
									}
								>
									{t(($) => $.common.exportAsPdf)}
								</Button>
							}
						>
							<div className="mb-2 flex justify-end"></div>
							<ThresholdLine y={dustThreshold.danger} dangerLevel="danger" />
							<ThresholdLine y={dustThreshold.warning} dangerLevel="warning" />
						</ChartLineDefault>
					</div>
				</div>
			)}
		</div>
	);
}
