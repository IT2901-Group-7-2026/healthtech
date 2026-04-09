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
import { type Aggregation, Aggregations } from "@/lib/dto";
import { buildSensorQuery } from "@/lib/sensor-query-utils";
import type { Sensor } from "@/lib/sensors";
import { getThreshold } from "@/lib/thresholds";
import { mapSensorDataToTimeBucketStatuses } from "@/lib/time-bucket-utils";
import { computeYAxisRange, downsampleSensorData, getHourDomainFromBuckets } from "@/lib/utils";
import { useQueries } from "@tanstack/react-query";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useId } from "react";
import { useTranslation } from "react-i18next";

export default function Noise() {
	const { view } = useView();
	const { t, i18n } = useTranslation();

	const { date } = useDate();
	const { user } = useUser();
	const { exportToPDF } = useExportPDF();
	const chartContainerId = useId();

	const sensor: Sensor = "noise";

	const parseAsAggregation = parseAsStringLiteral(Aggregations);

	const [aggregation, setAggregation] = useQueryState<Aggregation>(
		"aggregation",
		parseAsAggregation.withDefault("average"),
	);
	const usePeakAggregation = aggregation === "peak";
	const noiseThreshold = getThreshold(sensor);

	const query = buildSensorQuery(sensor, view, date, {
		usePeakAggregation,
	});

	// Retrieve week data to find the min and max hour the user has data
	const weekHourRangeQuery = buildSensorQuery(sensor, "week", date, {
		usePeakAggregation,
		granularity: "hour",
	});

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

	const maxValue = data
		? Math.max(...data.map((d) => (usePeakAggregation && d.peakValue ? d.peakValue : d.value)))
		: 0;

	const minY = 0;
	let maxY = 150;
	if (maxValue > maxY) {
		maxY = computeYAxisRange(data ?? [], {
			step: usePeakAggregation ? 130 : undefined,
		}).maxY;
	}

	const calendarData = mapSensorDataToTimeBucketStatuses(data ?? [], sensor, usePeakAggregation);

	return (
		<div className="flex flex-1 flex-col gap-4">
			<Tabs value={aggregation} onValueChange={(value) => setAggregation(value as Aggregation)}>
				<TabsList>
					<TabsTrigger value="average">{t(($) => $.measurement.average)}</TabsTrigger>
					<TabsTrigger value="peak">{t(($) => $.measurement.peak)}</TabsTrigger>
				</TabsList>
			</Tabs>

			{isLoading ? (
				<Card className="flex h-24 w-full items-center">
					<p>{t(($) => $.common.loading)}</p>
				</Card>
			) : isError ? (
				<Card className="flex h-24 w-full items-center">
					<p>{t(($) => $.common.error)}</p>
				</Card>
			) : view === "month" ? (
				<CalendarWidget selectedDay={date} selectedAggregation={aggregation} data={calendarData} />
			) : view === "week" ? (
				<WeekWidget dayStartHour={minHour} dayEndHour={maxHour} data={calendarData} />
			) : !data || data.length === 0 ? (
				<Card className="flex h-24 w-full items-center">
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
						<ChartLineDefault
							minHour={minHour}
							maxHour={maxHour}
							usePeakData={usePeakAggregation}
							chartData={downsampleSensorData(sensor, data ?? [])}
							chartTitle={date.toLocaleDateString(i18n.language, {
								day: "numeric",
								month: "long",
								year: "numeric",
							})}
							unit="db (TWA)"
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
											})}-${user.username}-Noise-Exposure-Overview`,
											`Noise Exposure - ${user.username} - ${date.toLocaleDateString(i18n.language)}`,
										)
									}
								>
									{t(($) => $.common.exportAsPdf)}
								</Button>
							}
						>
							<ThresholdLine
								y={
									usePeakAggregation
										? // biome-ignore lint/style/noNonNullAssertion: If usePeakAggregation is true and peakDangerLevel is null, there is a bug somewhere else
											noiseThreshold.peakDanger!
										: noiseThreshold.danger
								}
								dangerLevel="danger"
							/>
							{!usePeakAggregation && <ThresholdLine y={noiseThreshold.warning} dangerLevel="warning" />}
						</ChartLineDefault>
					</div>
				</div>
			)}
		</div>
	);
}
