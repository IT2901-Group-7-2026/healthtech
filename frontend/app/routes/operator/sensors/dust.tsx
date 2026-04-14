import { ChartLineDefault, ChartLineSkeleton, ThresholdLine } from "@/components/line-chart";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarWidget } from "@/features/calendar-widget/calendar-widget";
import { useDate } from "@/features/date-picker/use-date";
import { useUser } from "@/features/user/user-context";
import { useView } from "@/features/views/use-view";
import { WeekWidget } from "@/features/week-widget/week-widget";
import { useExportPDF } from "@/hooks/use-export-pdf";
import { sensorQueryOptions } from "@/lib/api";
import { buildSensorQuery } from "@/lib/sensor-query-utils";
import type { Sensor, SensorUnit } from "@/lib/sensors";
import { getThreshold } from "@/lib/thresholds";
import { mapSensorDataToTimeBucketStatuses } from "@/lib/time-bucket-utils";
import { computeYAxisRange, downsampleSensorData, formatSensorValue, getHourDomain } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";

export default function Dust() {
	const { view } = useView();
	const { date } = useDate();
	const { t, i18n } = useTranslation();
	const locale = i18n.language;
	const { user } = useUser();
	const { exportToPDF } = useExportPDF();
	const chartContainerId = useId();

	const [displayUnit, setDisplayUnit] = useState<SensorUnit>("μg/m³");

	const sensor: Sensor = "dust";

	const query = buildSensorQuery(sensor, view, date);

	const dustThreshold = getThreshold(sensor, query.field);

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

	const maxValue = data ? Math.max(...data.map((d) => d.value)) : 0;

	const minY = 0;
	const baseMaxY = 45;
	const maxY = maxValue > baseMaxY ? computeYAxisRange(data ?? []).maxY : baseMaxY;

	const calendarData = mapSensorDataToTimeBucketStatuses(data ?? [], sensor);
	const averageExposure =
		data && data.length > 0 ? data.reduce((sum, current) => sum + current.value, 0) / data.length : 0;

	const { minHour, maxHour } = getHourDomain(hourDomain, data?.map((d) => d.time) ?? [], view);

	return (
		<div className="flex flex-1 flex-col gap-4">
			{isLoading ? (
				<ChartLineSkeleton />
			) : isError ? (
				<Card className="flex h-full w-full items-center">
					<p>{t(($) => $.common.error)}</p>
				</Card>
			) : view === "month" ? (
				<CalendarWidget selectedDay={date} data={calendarData} />
			) : view === "week" ? (
				<WeekWidget dayStartHour={minHour} dayEndHour={maxHour} data={calendarData} />
			) : !data || data.length === 0 ? (
				<Card className="flex h-24 w-full items-center">
					<CardTitle>
						{date.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" })}
					</CardTitle>
					<p>{t(($) => $.common.noData)}</p>
				</Card>
			) : (
				<div className="w-full">
					<div id={chartContainerId}>
						<ChartLineDefault
							minHour={minHour}
							maxHour={maxHour}
							chartData={downsampleSensorData(sensor, data ?? [])}
							chartTitle={`${t(($) => $.measurement.averageExposure)}: ${formatSensorValue(averageExposure, displayUnit)} ${displayUnit}`}
							unit={displayUnit}
							maxY={maxY}
							minY={minY}
							lineType="monotone"
							sensor={sensor}
							dustField={query.field}
							headerRight={
								<div className="flex items-center gap-2">
									<Tabs value={displayUnit} onValueChange={(v) => setDisplayUnit(v as SensorUnit)}>
										<TabsList>
											<TabsTrigger value="μg/m³">{"μg/m³"}</TabsTrigger>
											<TabsTrigger value="mg/m³">{"mg/m³"}</TabsTrigger>
										</TabsList>
									</Tabs>
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
										{t(($) => $.common.exportAsPdf)}
									</Button>
								</div>
							}
						>
							<ThresholdLine y={dustThreshold.danger} dangerLevel="danger" />
							<ThresholdLine y={dustThreshold.warning} dangerLevel="warning" />
						</ChartLineDefault>
					</div>
				</div>
			)}
		</div>
	);
}
