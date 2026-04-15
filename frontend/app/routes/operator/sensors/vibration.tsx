import {
	ExposureLineChartCard,
	ExposureLineChartCardSkeleton,
} from "@/components/exposure-line-chart/exposure-line-chart-card";
import { ThresholdLine } from "@/components/exposure-line-chart/threshold-line";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { CalendarWidget } from "@/features/calendar-widget/calendar-widget";
import { useDate } from "@/features/date-picker/use-date";
import { useUser } from "@/features/user/user-context";
import { parseAsView } from "@/features/views/utils";
import { WeekWidget } from "@/features/week-widget/week-widget";
import { useExportPDF } from "@/hooks/use-export-pdf";
import { sensorQueryOptions } from "@/lib/api";
import { hourToTZDate } from "@/lib/date";
import { buildSensorQuery } from "@/lib/sensor-query-utils";
import type { Sensor } from "@/lib/sensors";
import { getThreshold } from "@/lib/thresholds";
import { mapSensorDataToTimeBucketStatuses } from "@/lib/time-bucket-utils";
import { computeYAxisRange, downsampleSensorData, getHourDomain } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useQueryState } from "nuqs";
import { useId } from "react";
import { useTranslation } from "react-i18next";

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

	const calendarData = mapSensorDataToTimeBucketStatuses(data ?? [], "vibration");
	const totalExposure = data && data.length > 0 ? data[data.length - 1].value : 0;

	const minTime = hourToTZDate(minHour, date);
	const maxTime = hourToTZDate(maxHour, date);

	return (
		<div className="flex h-full w-full flex-col-reverse gap-4 md:flex-row">
			<div className="flex flex-1 flex-col gap-4">
				{isLoading ? (
					<ExposureLineChartCardSkeleton />
				) : isError ? (
					<Card className="flex h-full w-full items-center">
						<p>{t(($) => $.common.error)}</p>
					</Card>
				) : view === "month" ? (
					<CalendarWidget selectedDay={date} data={calendarData} />
				) : view === "week" ? (
					<WeekWidget dayStartHour={minHour} dayEndHour={maxHour} data={calendarData} />
				) : !data || data.length === 0 ? (
					<Card className="flex h-full w-full items-center">
						<CardTitle>
							{date.toLocaleDateString(i18n.language, {
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
							<ExposureLineChartCard
								minTime={minTime}
								maxTime={maxTime}
								chartData={downsampleSensorData(sensor, data ?? [])}
								chartTitle={`${t(($) => $.common.total)}: ${Math.trunc(totalExposure)} ${t(($) => $.common.points)}`}
								unit={t(($) => $.common.points)}
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
												`${date.toLocaleDateString(i18n.language, {
													day: "numeric",
													month: "long",
													year: "numeric",
												})}-${user.username}-Vibration-Exposure-Overview`,
												`Vibration Exposure - ${user.username} - ${date.toLocaleDateString(i18n.language)}`,
											)
										}
									>
										{t(($) => $.common.exportAsPdf)}
									</Button>
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
	);
}
