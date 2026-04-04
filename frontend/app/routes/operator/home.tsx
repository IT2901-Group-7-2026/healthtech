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

export default function OperatorHome() {
	const { t, i18n } = useTranslation();

	const { view } = useView();
	const { date } = useDate();
	const { exportMultipleToPDF } = useExportPDF();

	const pdfDustChartContainerId = useId();
	const pdfVibrationChartContainerId = useId();
	const pdfNoiseChartContainerId = useId();

	const { user } = useUser();

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
							data={mapOverviewDataToTimeBucketStatuses(overviewBuckets ?? [])}
						/>
					) : view === "week" ? (
						<div className="w-3/4">
							<WeekWidget
								dayStartHour={0}
								dayEndHour={23}
								data={mapOverviewDataToTimeBucketStatuses(overviewBuckets ?? [])}
							/>
						</div>
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
							data={mapOverviewBucketsToChartRows(overviewBuckets ?? [], 0, 23)}
							startHour={0}
							endHour={23}
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
											`${date.toLocaleDateString(i18n.language, {
												day: "numeric",
												month: "long",
												year: "numeric",
											})}-${user.username}-Exposure-Overview`,
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
