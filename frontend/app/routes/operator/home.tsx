/** biome-ignore-all lint/suspicious/noAlert: we allow alerts for testing */

import { ExportButton } from "@/components/export-button";
import { Card } from "@/components/ui/card";
import { CalendarWidget } from "@/features/calendar-widget/calendar-widget";
import { useDate } from "@/features/date-picker/use-date";
import { DayWidget } from "@/features/day-widget/day-widget";
import { exposures } from "@/features/exposure-picker/exposures";
import { ExposureGraphEmptyState } from "@/features/statistic-card";
import { useUser } from "@/features/user/user-context";
import { useView } from "@/features/views/use-view";
import { WeekWidget } from "@/features/week-widget/week-widget";
import { useExportPDF } from "@/hooks/use-export-pdf";
import { exposureOverviewQueryOptions } from "@/lib/api";
import { buildExposureOverviewQuery } from "@/lib/exposure-query-utils";
import { mapOverviewBucketsToChartRows, mapOverviewDataToTimeBucketStatuses } from "@/lib/time-bucket-utils";
import { getHourDomain } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useId } from "react";
import { useTranslation } from "react-i18next";
import Dust from "./exposures/dust";
import Noise from "./exposures/noise";
import Vibration from "./exposures/vibration";

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
		data: response,
		isLoading,
		isError,
	} = useQuery(
		exposureOverviewQueryOptions({
			query: buildExposureOverviewQuery([...exposures], view, date),
			userId: user.id,
		}),
	);

	const overviewBuckets = response?.data;
	const hourDomain = response?.hourDomain;

	const { minHour, maxHour } = getHourDomain(
		hourDomain,
		overviewBuckets?.map((d) => d.time),
		"week", // The overview never shows linecharts so should always calculate hour domain with week padding
	);

	return (
		<>
			<div className="flex w-full min-w-0 flex-col gap-4">
				{isLoading ? (
					<Card className="flex h-24 w-full items-center">
						<p>{t(($) => $.common.loading)}</p>
					</Card>
				) : isError ? (
					<Card className="flex h-24 w-full items-center">
						<p>{t(($) => $.common.error)}</p>
					</Card>
				) : view === "month" ? (
					<CalendarWidget
						selectedDay={date}
						data={mapOverviewDataToTimeBucketStatuses(overviewBuckets ?? [])}
					/>
				) : view === "week" ? (
					<WeekWidget
						dayStartHour={minHour}
						dayEndHour={maxHour}
						data={mapOverviewDataToTimeBucketStatuses(overviewBuckets ?? [])}
					/>
				) : !overviewBuckets || overviewBuckets.length === 0 ? (
					<ExposureGraphEmptyState date={date} locale={i18n.language} />
				) : (
					<DayWidget
						data={mapOverviewBucketsToChartRows(overviewBuckets ?? [], 0, 23)}
						startHour={minHour}
						endHour={maxHour}
						headerRight={
							<ExportButton
								title={t(($) => $.layout.export)}
								onClick={() =>
									exportMultipleToPDF(
										[
											pdfDustChartContainerId,
											pdfNoiseChartContainerId,
											pdfVibrationChartContainerId,
										],
										`${date.toLocaleDateString(i18n.language, {
											day: "numeric",
											month: "long",
											year: "numeric",
										})}-${user.name}-Exposure-Overview`,
										[
											`${t(($) => $.pdf.dustExposure)} - ${user.name} - ${date.toLocaleDateString(i18n.language)}`,
											`${t(($) => $.pdf.noiseExposure)} - ${user.name} - ${date.toLocaleDateString(i18n.language)}`,
											`${t(($) => $.pdf.vibrationExposure)} - ${user.name} - ${date.toLocaleDateString(i18n.language)}`,
										],
									)
								}
							/>
						}
					/>
				)}
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
