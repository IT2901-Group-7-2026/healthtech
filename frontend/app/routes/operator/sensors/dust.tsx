/** biome-ignore-all lint/suspicious/noAlert: We use alert for testing, but will be changed later */

import { DailyNotes } from "@/components/daily-notes.tsx";
import { ChartLineDefault, ThresholdLine } from "@/components/line-chart.tsx";
import { Summary } from "@/components/summary.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardTitle } from "@/components/ui/card.tsx";
import { CalendarWidget } from "@/features/calendar-widget/calendar-widget.tsx";
import { useDate } from "@/features/date-picker/use-date.ts";
import { useUser } from "@/features/user/user-context.tsx";
import { useView } from "@/features/views/use-view.ts";
import { WeekWidget } from "@/features/week-widget/week-widget.tsx";
import { useExportPDF } from "@/hooks/use-export-pdf.ts";
import { getLocale } from "@/i18n/locale.ts";
import { sensorQueryOptions } from "@/lib/api.ts";
import { buildSensorQuery } from "@/lib/sensor-query-utils.ts";
import { type Sensor } from "@/lib/sensors.ts";
import { thresholds } from "@/lib/thresholds.ts";
import {
	calculateSummaryCounts,
	mapSensorDataToTimeBucketStatuses,
} from "@/lib/time-bucket-utils.ts";
import { computeYAxisRange } from "@/lib/utils.ts";
import { useQueries } from "@tanstack/react-query";
import { useId } from "react";
import { useTranslation } from "react-i18next";

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: help
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
	const daySummaryQuery = buildSensorQuery(sensor, view, date, {
		granularity: "hour",
	});

	const useDaySummary = view === "day";

	const [{ data, isLoading, isError }, { data: daySummaryData }] = useQueries(
		{
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
		},
	);

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
					data={calculateSummaryCounts(
						(useDaySummary ? daySummaryData : data) ?? [],
					)}
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
					<WeekWidget
						locale={getLocale(locale)}
						dayStartHour={0}
						dayEndHour={23}
						weekStartsOn={1}
						data={calendarData}
					/>
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
								headerRight={
									<Button
										size="sm"
										variant="outline"
										onClick={() =>
											exportToPDF(
												chartContainerId,
												`${date.toLocaleDateString(
													locale,
													{
														day: "numeric",
														month: "long",
														year: "numeric",
													},
												)}-${user.username}-Dust-Exposure-Overview`,
												`Dust Exposure - ${user.username} - ${date.toLocaleDateString(locale)}`,
											)
										}
									>
										{t(($) => $.vibrationExposure.export)}
									</Button>
								}
							>
								<div className="mb-2 flex justify-end"></div>
								<ThresholdLine
									y={thresholds.dust.danger}
									dangerLevel="danger"
								/>
								<ThresholdLine
									y={thresholds.dust.warning}
									dangerLevel="warning"
								/>
							</ChartLineDefault>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
