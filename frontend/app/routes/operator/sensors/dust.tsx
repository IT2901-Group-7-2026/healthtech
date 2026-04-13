import { ChartLineDefault, ThresholdLine } from "@/components/line-chart";
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
import type { Sensor } from "@/lib/sensors";
import { getThreshold } from "@/lib/thresholds";
import { mapSensorDataToTimeBucketStatuses } from "@/lib/time-bucket-utils";
import { computeYAxisRange, downsampleSensorData, getHourDomainFromBuckets } from "@/lib/utils";
import { useQueries } from "@tanstack/react-query";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";

type DustUnit = "μg/m³" | "mg/m³";

const UG_TO_MG = 0.001;

function convertValue(value: number, unit: DustUnit) {
	return unit === "mg/m³" ? value * UG_TO_MG : value;
}

function convertThreshold(threshold: number, unit: DustUnit) {
	return unit === "mg/m³" ? threshold * UG_TO_MG : threshold;
}

function formatAverage(value: number, unit: DustUnit) {
	return unit === "mg/m³" ? value.toFixed(4) : Math.trunc(value);
}

export default function Dust() {
	const { view } = useView();
	const { date } = useDate();
	const { t, i18n } = useTranslation();
	const locale = i18n.language;
	const { user } = useUser();
	const { exportToPDF } = useExportPDF();
	const chartContainerId = useId();

	const [displayUnit, setDisplayUnit] = useState<DustUnit>("μg/m³");

	const sensor: Sensor = "dust";

	const query = buildSensorQuery(sensor, view, date);

	const weekHourRangeQuery = buildSensorQuery(sensor, "week", date, {
		granularity: "hour",
	});

	const dustThreshold = getThreshold(sensor, query.field);

	const [dataResult, weekHourRangeResult] = useQueries({
		queries: [
			sensorQueryOptions({
				sensor,
				query,
				userId: user.id,
			}),
			sensorQueryOptions({
				sensor,
				query: weekHourRangeQuery,
				userId: user.id,
			}),
		],
	});

	const { data, isLoading, isError } = dataResult;
	const { minHour, maxHour } = getHourDomainFromBuckets(weekHourRangeResult.data ?? []);

	const convertedData = data?.map((d) => ({
		...d,
		value: convertValue(d.value, displayUnit),
		peakValue: d.peakValue == null ? d.peakValue : convertValue(d.peakValue, displayUnit),
	}));

	const maxValue = convertedData ? Math.max(...convertedData.map((d) => d.value)) : 0;

	const minY = 0;
	const baseMaxY = convertValue(45, displayUnit);
	const maxY = maxValue > baseMaxY ? computeYAxisRange(convertedData ?? []).maxY : baseMaxY;

	const calendarData = mapSensorDataToTimeBucketStatuses(data ?? [], sensor);
	const averageExposure =
		convertedData && convertedData.length > 0
			? convertedData.reduce((sum, d) => sum + d.value, 0) / convertedData.length
			: 0;

	const dangerThreshold = convertThreshold(dustThreshold.danger, displayUnit);
	const warningThreshold = convertThreshold(dustThreshold.warning, displayUnit);

	return (
		<div className="flex flex-1 flex-col gap-4">
			{isLoading ? (
				<Card className="flex h-24 w-full items-center">
					<p>{t(($) => $.common.loading)}</p>
				</Card>
			) : isError ? (
				<Card className="flex h-24 w-full items-center">
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
							chartData={downsampleSensorData(sensor, convertedData ?? [])}
							chartTitle={`${t(($) => $.measurement.averageExposure)}: ${formatAverage(averageExposure, displayUnit)} ${displayUnit}`}
							unit={displayUnit}
							maxY={maxY}
							minY={minY}
							lineType="monotone"
							sensor={sensor}
							dustField={query.field}
							headerRight={
								<div className="flex items-center gap-2">
									<Tabs value={displayUnit} onValueChange={(v) => setDisplayUnit(v as DustUnit)}>
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
							<ThresholdLine y={dangerThreshold} dangerLevel="danger" />
							<ThresholdLine y={warningThreshold} dangerLevel="warning" />
						</ChartLineDefault>
					</div>
				</div>
			)}
		</div>
	);
}
