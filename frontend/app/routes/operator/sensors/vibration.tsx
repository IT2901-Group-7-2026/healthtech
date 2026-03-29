/** biome-ignore-all lint/suspicious/noAlert: we allow alerts for testing */

import { DailyNotes } from "@/components/daily-notes";
import { ChartLineDefault, ThresholdLine } from "@/components/line-chart";
import { Summary } from "@/components/summary";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { CalendarWidget } from "@/features/calendar-widget/calendar-widget";
import { useDate } from "@/features/date-picker/use-date";
import { useUser } from "@/features/user/user-context";
import { parseAsView } from "@/features/views/utils";
import { WeekWidget } from "@/features/week-widget/week-widget";
import { useExportPDF } from "@/hooks/use-export-pdf";
import { getLocale } from "@/i18n/locale";
import { sensorQueryOptions } from "@/lib/api";
import { buildSensorQuery } from "@/lib/sensor-query-utils";
import type { Sensor } from "@/lib/sensors";
import { getThreshold } from "@/lib/thresholds";
import {
	calculateSummaryCounts,
	mapSensorDataToTimeBucketStatuses,
} from "@/lib/time-bucket-utils";
import { computeYAxisRange } from "@/lib/utils";
import { useQueries } from "@tanstack/react-query";
import { useQueryState } from "nuqs";
import { useId } from "react";
import { useTranslation } from "react-i18next";

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: help
export default function Vibration() {
	const [view] = useQueryState("view", parseAsView.withDefault("day"));
	const { t, i18n } = useTranslation();

	const { date } = useDate();
	const { user } = useUser();
	const { exportToPDF } = useExportPDF();
	const chartContainerId = useId();

	const sensor: Sensor = "vibration";
	const vibrationThreshold = getThreshold(sensor);

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
	let maxY = 450;
	if (maxValue > maxY) {
		maxY = computeYAxisRange(data ?? []).maxY;
	}

	const calendarData = mapSensorDataToTimeBucketStatuses(
		data ?? [],
		"vibration",
	);

	return (
		<div className="flex w-full flex-col-reverse gap-4 md:flex-row">
			<div className="flex flex-col gap-4 md:w-1/5">
				<Summary
					exposureType="vibration"
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
						locale={getLocale(i18n.language)}
						dayStartHour={0}
						dayEndHour={23}
						weekStartsOn={1}
						data={calendarData}
					/>
				) : !data || data.length === 0 ? (
					<Card className="flex h-24 w-full items-center">
						<CardTitle>
							{date.toLocaleDateString(i18n.language, {
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
								chartData={data}
								chartTitle={date.toLocaleDateString(
									i18n.language,
									{
										day: "numeric",
										month: "long",
										year: "numeric",
									},
								)}
								unit={t(($) => $.points)}
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
													i18n.language,
													{
														day: "numeric",
														month: "long",
														year: "numeric",
													},
												)}-${user.username}-Vibration-Exposure-Overview`,
												`Vibration Exposure - ${user.username} - ${date.toLocaleDateString(i18n.language)}`,
											)
										}
									>
										{t(($) => $.vibrationExposure.export)}
									</Button>
								}
							>
								<ThresholdLine
									y={vibrationThreshold.danger}
									dangerLevel="danger"
								/>
								<ThresholdLine
									y={vibrationThreshold.warning}
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
