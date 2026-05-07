import { ExportButton } from "@/components/export-button.tsx";
import { Card } from "@/components/ui/card.tsx";
import { CalendarWidget } from "@/features/calendar-widget/calendar-widget.tsx";
import { useDate } from "@/features/date-picker/use-date.ts";
import { DayWidget } from "@/features/day-widget/day-widget.tsx";
import { exposures } from "@/features/exposure-picker/exposures.ts";
import { ExposureGraphEmptyState } from "@/features/statistic-card.tsx";
import { useUser } from "@/features/user/user-context.tsx";
import { useView } from "@/features/views/use-view.ts";
import { WeekWidget } from "@/features/week-widget/week-widget.tsx";
import { useExportPDF } from "@/hooks/use-export-pdf.ts";
import { exposureOverviewQueryOptions } from "@/lib/api.ts";
import { buildExposureOverviewQuery } from "@/lib/exposure-query-utils.ts";
import { mapOverviewBucketsToChartRows, mapOverviewDataToTimeBucketStatuses } from "@/lib/time-bucket-utils.ts";
import { getHourDomain } from "@/lib/utils.ts";
import { useQuery } from "@tanstack/react-query";
import { useId } from "react";
import { useTranslation } from "react-i18next";
import Dust from "./exposures/dust.tsx";
import Noise from "./exposures/noise.tsx";
import Vibration from "./exposures/vibration.tsx";

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
