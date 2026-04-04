/** biome-ignore-all lint/suspicious/noAlert: We use alert for testing, but will be changed later */

import { DailyNotes } from "@/components/daily-notes";
import { ChartLineDefault, ThresholdLine } from "@/components/line-chart";
import { Summary } from "@/components/summary";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { CalendarWidget } from "@/features/calendar-widget/calendar-widget";
import { useDate } from "@/features/date-picker/use-date";
import { useUser } from "@/features/user/user-context";
import { useView } from "@/features/views/use-view";
import { WeekWidget } from "@/features/week-widget/week-widget";
import { useExportPDF } from "@/hooks/use-export-pdf";
import { sensorOverviewQueryOptions, sensorQueryOptions } from "@/lib/api";
import { buildSensorOverviewQuery, buildSensorQuery } from "@/lib/sensor-query-utils";
import { type Sensor, sensors } from "@/lib/sensors";
import { getThreshold } from "@/lib/thresholds";
import { calculateSummaryCounts, mapSensorDataToTimeBucketStatuses } from "@/lib/time-bucket-utils";
import { computeYAxisRange } from "@/lib/utils";
import { useQueries, useQuery } from "@tanstack/react-query";
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

	// Retrieve week data to find the min and max time the user has data
	const queryToFindMinMaxData = useQuery(
		sensorOverviewQueryOptions({
			query: buildSensorOverviewQuery([...sensors], "week", date),
			userId: user.id,
		}),
	);

	function getMinMaxTime(dataFromQuery: typeof queryToFindMinMaxData.data) {
		if (!dataFromQuery || dataFromQuery.length === 0) {
			return { minTime: undefined, maxTime: undefined };
		}

		let minimumTime = new Date(dataFromQuery[0].time).getTime();
		let maximumTime = new Date(dataFromQuery[0].time).getTime();

		for (const bucket of dataFromQuery) {
			const time = new Date(bucket.time).getTime();

			if (time < minimumTime) minimumTime = time;
			if (time > maximumTime) maximumTime = time;
		}

		return { minTime: new Date(minimumTime), maxTime: new Date(maximumTime) };
	}

	const { minTime, maxTime } = getMinMaxTime(queryToFindMinMaxData.data ?? []);

	const sensor: Sensor = "dust";

	const query = buildSensorQuery(sensor, view, date);
	const daySummaryQuery = buildSensorQuery(sensor, view, date, {
		granularity: "hour",
	});

	const useDaySummary = view === "day";
	const dustThreshold = getThreshold(sensor, query.field);

	const [{ data, isLoading, isError }, { data: daySummaryData }] = useQueries({
		queries: [
			sensorQueryOptions({
				sensor,
				query,
				userId: user.id,
			}),
			sensorQueryOptions({
				sensor,
				query: daySummaryQuery,
				userId: user.id,
				enabled: useDaySummary,
			}),
		],
	});

	const maxValue = data ? Math.max(...data.map((d) => d.value)) : 0;

	const minY = 0;
	let maxY = 45;
	if (maxValue > maxY) {
		maxY = computeYAxisRange(data ?? []).maxY;
	}

	const calendarData = mapSensorDataToTimeBucketStatuses(data ?? [], sensor);

	return (
		<div className="flex w-full flex-col-reverse gap-4 md:flex-row">
			<div className="flex flex-col gap-4 md:w-1/5">
				<Summary
					exposureType={sensor}
					view={view}
					data={calculateSummaryCounts((useDaySummary ? daySummaryData : data) ?? [], sensor)}
				/>
				<DailyNotes />
			</div>
			<div className="flex flex-1 flex-col items-end gap-4">
				{isLoading ? (
					<Card className="flex h-24 w-full items-center">
						<p>{t(($) => $.loadingData)}</p>
					</Card>
				) : isError ? (
					<Card className="flex h-24 w-full items-center">
						<p>{t(($) => $.errorLoadingData)}</p>
					</Card>
				) : view === "month" ? (
					<CalendarWidget selectedDay={date} data={calendarData} />
				) : view === "week" ? (
					<WeekWidget dayStartHour={0} dayEndHour={23} data={calendarData} />
				) : !data || data.length === 0 ? (
					<Card className="flex h-24 w-full items-center">
						<CardTitle>
							{date.toLocaleDateString(locale, {
								day: "numeric",
								month: "long",
								year: "numeric",
							})}
						</CardTitle>
						<p>{t(($) => $.noData)}</p>
					</Card>
				) : (
					<div className="w-full">
						<div id={chartContainerId}>
							<ChartLineDefault
								minTime={minTime ?? new Date()}
								maxTime={maxTime ?? new Date()}
								chartData={data ?? []}
								chartTitle={date.toLocaleDateString(locale, {
									day: "numeric",
									month: "long",
									year: "numeric",
								})}
								unit={t(($) => $.dust_y_axis)}
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
										{t(($) => $.vibrationExposure.export)}
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
		</div>
	);
}
