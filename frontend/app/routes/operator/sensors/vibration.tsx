/** biome-ignore-all lint/suspicious/noAlert: we allow alerts for testing */

import { DailyNotes } from "@/components/daily-notes.tsx";
import { ChartLineDefault, ThresholdLine } from "@/components/line-chart.tsx";
import { Summary } from "@/components/summary.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardTitle } from "@/components/ui/card.tsx";
import { CalendarWidget } from "@/features/calendar-widget/calendar-widget.tsx";
import { useDate } from "@/features/date-picker/use-date.ts";
import { useUser } from "@/features/user/user-context.tsx";
import { parseAsView } from "@/features/views/utils.ts";
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
									y={thresholds.vibration.danger}
									dangerLevel="danger"
								/>
								<ThresholdLine
									y={thresholds.vibration.warning}
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
