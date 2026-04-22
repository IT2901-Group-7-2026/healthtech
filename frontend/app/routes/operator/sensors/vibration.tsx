import { ExportButton } from "@/components/export-button";
import {
	ExposureLineChartCard,
	ExposureLineChartCardSkeleton,
} from "@/components/exposure-line-chart/exposure-line-chart-card";
import { ThresholdLine } from "@/components/exposure-line-chart/threshold-line";
import { CalendarWidget } from "@/features/calendar-widget/calendar-widget";
import { useDate } from "@/features/date-picker/use-date";
import { SensorGraphEmptyState, SensorStatisticsSection } from "@/features/statistic-card";
import { getMaxPointByValue } from "@/features/statistic-card-utils";
import { VibrationTrendLineChartCard } from "@/features/trend-line-chart-card/vibration-trend-line-chart-card";
import { useUser } from "@/features/user/user-context";
import { parseAsView } from "@/features/views/utils";
import { WeekWidget } from "@/features/week-widget/week-widget";
import { useExportPDF } from "@/hooks/use-export-pdf";
import { useFormatDate } from "@/hooks/use-format-date";
import { sensorQueryOptions } from "@/lib/api";
import { buildSensorQuery } from "@/lib/sensor-query-utils";
import type { Sensor } from "@/lib/sensors";
import { getThreshold } from "@/lib/thresholds";
import { mapSensorDataToTimeBucketStatuses } from "@/lib/time-bucket-utils";
import { computeYAxisRange, downsampleSensorData, getHourDomain } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { setHours } from "date-fns";
import { useQueryState } from "nuqs";
import { useId } from "react";
import { useTranslation } from "react-i18next";

export default function Vibration() {
	const [view] = useQueryState("view", parseAsView.withDefault("day"));
	const { t, i18n } = useTranslation();
	const formatDate = useFormatDate();

	const { date } = useDate();
	const { user } = useUser();
	const { exportToPDF } = useExportPDF();
	const chartContainerId = useId();

	const sensor: Sensor = "vibration";
	const vibrationThreshold = getThreshold(sensor);

	const query = buildSensorQuery(sensor, view, date);

	const {
		data: response,
		isLoading,
		isError,
	} = useQuery(
		sensorQueryOptions({
			sensor,
			query,
			userId: user.id,
		}),
	);

	const data = response?.data;
	const hourDomain = response?.hourDomain;
	const maxPoint = data && data.length > 0 ? getMaxPointByValue(data, (point) => point.value) : null;

	const { minHour, maxHour } = getHourDomain(
		hourDomain,
		data?.map((d) => d.time),
		view,
	);

	const maxValue = data ? Math.max(...data.map((d) => d.value)) : 0;

	const minY = 0;
	let maxY = 450;
	if (maxValue > maxY) {
		maxY = computeYAxisRange(data ?? []).maxY;
	}

	const calendarData = mapSensorDataToTimeBucketStatuses(data ?? [], "vibration", false);
	const minTime = setHours(date, minHour);
	const maxTime = setHours(date, maxHour);

	const showTrendLineChart = view === "month" || view === "week";
	const showVibrationStatistics = view === "day";

	return (
		<div className="flex flex-col gap-16">
			<div className="flex h-full w-full flex-col-reverse gap-4 md:flex-row">
				<div className="flex flex-1 flex-col gap-4">
					{showVibrationStatistics && (
						<SensorStatisticsSection
							isLoading={isLoading}
							isEmpty={isError || !data?.length}
							averageValue={null}
							maxValue={maxPoint?.value ?? null}
							maxTime={null}
							latestValue={null}
							dangerThreshold={vibrationThreshold.danger}
							unit="points"
							formatTime={(time) => formatDate(time, "HH:mm")}
						/>
					)}

					{isLoading ? (
						<ExposureLineChartCardSkeleton />
					) : isError ? (
						<SensorGraphEmptyState date={date} locale={i18n.language} />
					) : view === "month" ? (
						<CalendarWidget selectedDay={date} data={calendarData} />
					) : view === "week" ? (
						<WeekWidget dayStartHour={minHour} dayEndHour={maxHour} data={calendarData} />
					) : !data || data.length === 0 ? (
						<SensorGraphEmptyState date={date} locale={i18n.language} />
					) : (
						<div className="w-full">
							<div id={chartContainerId}>
								<ExposureLineChartCard
									minTime={minTime}
									maxTime={maxTime}
									chartData={downsampleSensorData(sensor, data ?? [])}
									unit={"points"}
									maxY={maxY}
									minY={minY}
									lineType="monotone"
									sensor={sensor}
									headerRight={
										<ExportButton
											title={t(($) => $.common.exportAsPdf)}
											onClick={() =>
												exportToPDF(
													chartContainerId,
													`${date.toLocaleDateString(i18n.language, {
														day: "numeric",
														month: "long",
														year: "numeric",
													})}-${user.name}-Vibration-Exposure-Overview`,
													`${t(($) => $.pdf.vibrationExposure)} - ${user.name} - ${date.toLocaleDateString(i18n.language)}`,
												)
											}
										/>
									}
								>
									<ThresholdLine y={vibrationThreshold.danger} dangerLevel="danger" />
									<ThresholdLine y={vibrationThreshold.warning} dangerLevel="warning" />
								</ExposureLineChartCard>
							</div>
						</div>
					)}
				</div>
			</div>
			{showTrendLineChart && <VibrationTrendLineChartCard />}
		</div>
	);
}
