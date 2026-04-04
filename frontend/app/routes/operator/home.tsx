/** biome-ignore-all lint/suspicious/noAlert: we allow alerts for testing */

import { DailyBarChart } from "@/components/daily-bar-chart";
import { DailyNotes } from "@/components/daily-notes";
import { Summary } from "@/components/summary";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { CalendarWidget } from "@/features/calendar-widget/calendar-widget";
import { useDate } from "@/features/date-picker/use-date";
import { sensors } from "@/features/sensor-picker/sensors";
import { useUser } from "@/features/user/user-context";
import { useView } from "@/features/views/use-view";
import { WeekWidget } from "@/features/week-widget/week-widget";
import { useExportPDF } from "@/hooks/use-export-pdf";
import { getLocale } from "@/i18n/locale";
import { sensorOverviewQueryOptions } from "@/lib/api";
import { buildSensorOverviewQuery } from "@/lib/sensor-query-utils";
import {
	calculateSummaryCounts,
	mapOverviewBucketsToChartRows,
	mapOverviewDataToTimeBucketStatuses,
} from "@/lib/time-bucket-utils";
import { useQuery } from "@tanstack/react-query";
import { useId } from "react";
import { useTranslation } from "react-i18next";
import Dust from "./sensors/dust";
import Noise from "./sensors/noise";
import Vibration from "./sensors/vibration";

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: help
export default function OperatorHome() {
	const { t, i18n } = useTranslation();

	const { view } = useView();
	const { date } = useDate();
	const { exportMultipleToPDF } = useExportPDF();

	const pdfDustChartContainerId = useId();
	const pdfVibrationChartContainerId = useId();
	const pdfNoiseChartContainerId = useId();

	const { user } = useUser();

	const queryType =
		view === "day" ? "week" : view === "week" ? "month" : "day";

	// NOTE: If we later add a peak noise switch here it wouldn't work because we don't return peakDangerLevel in the overview query.
	const {
		data: overviewBuckets,
		isLoading,
		isError,
	} = useQuery(
		sensorOverviewQueryOptions({
			query: buildSensorOverviewQuery([...sensors], view, date),
			userId: user.id,
		}),
	);

	// Retrieve week or month data to find the min and max hour the user has data for that time period
	const queryToFindMixMaxData = useQuery(
		sensorOverviewQueryOptions({
			query: buildSensorOverviewQuery([...sensors], queryType, date),
			userId: user.id,
		}),
	);

	function getHourDomainFromBuckets(buckets: typeof overviewBuckets) {
		if (!buckets || buckets.length === 0) {
			return { minHour: 0, maxHour: 23 };
		}

		let minimumHour = 23;
		let maximumHour = 0;

		for (const bucket of buckets) {
			const hour = new Date(bucket.time).getHours();

			if (hour < minimumHour) minimumHour = hour;
			if (hour > maximumHour) maximumHour = hour;
		}

		return { minHour: minimumHour, maxHour: maximumHour };
	}
	let minHour: number, maxHour: number;
	if (view === "day") {
		({ minHour, maxHour } = getHourDomainFromBuckets(
			queryToFindMixMaxData.data ?? [],
		));
	} else {
		({ minHour, maxHour } = getHourDomainFromBuckets(
			overviewBuckets ?? [],
		));
	}

	return (
		<>
			<div className="flex w-full flex-col-reverse gap-4 md:flex-row">
				<div className="flex w-1/5 shrink-0 flex-col gap-4">
					<Summary
						exposureType="all"
						view={view}
						data={calculateSummaryCounts(overviewBuckets ?? [])}
						mode="sensor"
					/>
					<DailyNotes />
				</div>

				<div className="flex w-full min-w-0 flex-col gap-4">
					{isLoading ? (
						<Card className="flex h-24 w-full items-center">
							<p>{t(($) => $.loadingData)}</p>
						</Card>
					) : isError ? (
						<Card className="flex h-24 w-full items-center">
							<p>{t(($) => $.errorLoadingData)}</p>
						</Card>
					) : view === "month" ? (
						<CalendarWidget
							selectedDay={date}
							data={mapOverviewDataToTimeBucketStatuses(
								overviewBuckets ?? [],
							)}
						/>
					) : view === "week" ? (
						<WeekWidget
							locale={getLocale(i18n.language)}
							dayStartHour={minHour}
							dayEndHour={maxHour + 1}
							weekStartsOn={1}
							data={mapOverviewDataToTimeBucketStatuses(
								overviewBuckets ?? [],
							)}
						/>
					) : !overviewBuckets || overviewBuckets.length === 0 ? (
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
						<DailyBarChart
							data={mapOverviewBucketsToChartRows(
								overviewBuckets ?? [],
								0,
								23,
							)}
							startHour={minHour}
							endHour={maxHour}
							chartTitle={date.toLocaleDateString(i18n.language, {
								day: "numeric",
								month: "long",
								year: "numeric",
							})}
							headerRight={
								<Button
									onClick={() =>
										exportMultipleToPDF(
											[
												pdfDustChartContainerId,
												pdfVibrationChartContainerId,
												pdfNoiseChartContainerId,
											],
											`${date.toLocaleDateString(
												i18n.language,
												{
													day: "numeric",
													month: "long",
													year: "numeric",
												},
											)}-${user.username}-Exposure-Overview`,
											[
												`Dust Exposure - ${user.username} - ${date.toLocaleDateString(i18n.language)}`,
												`Vibration Exposure - ${user.username} - ${date.toLocaleDateString(i18n.language)}`,
												`Noise Exposure - ${user.username} - ${date.toLocaleDateString(i18n.language)}`,
											],
										)
									}
									variant="outline"
								>
									{t(($) => $.layout.export)}
								</Button>
							}
						/>
					)}
				</div>
			</div>
			<div
				style={{
					position: "fixed",
					top: "-9999px",
					left: "-9999px",
					width: "1200px",
					background: "white",
				}}
			>
				<div id={pdfDustChartContainerId}>
					<Dust />
				</div>

				<div id={pdfVibrationChartContainerId}>
					<Vibration />
				</div>

				<div id={pdfNoiseChartContainerId}>
					<Noise />
				</div>
			</div>
		</>
	);
}
