import { ExportButton } from "@/components/export-button";
import {
	ExposureLineChartCard,
	ExposureLineChartCardSkeleton,
} from "@/components/exposure-line-chart/exposure-line-chart-card";
import { ThresholdLine } from "@/components/exposure-line-chart/threshold-line";
import { ExposureSlider } from "@/components/exposure-slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDate } from "@/features/date-picker/use-date";
import { DayWidget } from "@/features/day-widget/day-widget";
import { SensorStatisticsSection } from "@/features/statistic-card";
import { getMaxPointByValue } from "@/features/statistic-card-utils";
import { DustTrendLineChartCard } from "@/features/trend-line-chart-card/dust-trend-line-chart-card";
import { NoiseTrendLineChartCard } from "@/features/trend-line-chart-card/noise-trend-line-chart-card";
import { VibrationTrendLineChartCard } from "@/features/trend-line-chart-card/vibration-trend-line-chart-card";
import { useView } from "@/features/views/use-view";
import { WeekWidget } from "@/features/week-widget/week-widget";
import { useExportPDF } from "@/hooks/use-export-pdf";
import { useFormatDate } from "@/hooks/use-format-date";
import { sensorOverviewQueryOptions, sensorQueryOptions } from "@/lib/api";
import { getDangerLevel } from "@/lib/danger-levels";
import {
	type Aggregation,
	Aggregations,
	type SensorDto,
	type SensorOverviewBucketDto,
	type UserWithStatusDto,
} from "@/lib/dto";
import { buildSensorOverviewQuery, buildSensorQuery } from "@/lib/sensor-query-utils";
import {
	type DustField,
	defaultDustField,
	dustFields,
	parseAsDustField,
	parseAsSensorUnit,
	type Sensor,
	type SensorUnit,
	sensors,
} from "@/lib/sensors";
import { getThreshold } from "@/lib/thresholds";
import { mapOverviewBucketsToChartRows, mapOverviewDataToTimeBucketStatuses } from "@/lib/time-bucket-utils";
import { computeYAxisRange, downsampleSensorData, getHourDomain } from "@/lib/utils";
import type { TZDate } from "@date-fns/tz";
import { useQueries, useQuery } from "@tanstack/react-query";
import { setHours } from "date-fns";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { type ReactNode, useId } from "react";
import { useTranslation } from "react-i18next";

export function UserDetails({ selectedUser, sensor }: { selectedUser: UserWithStatusDto; sensor: Sensor | null }) {
	return (
		<section className="flex flex-col gap-6">
			<div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
				<div className="space-y-1">
					<h2 className="font-semibold text-2xl">{selectedUser.name}</h2>
					<p className="text-muted-foreground">{selectedUser.email}</p>
				</div>
			</div>

			<div className="flex flex-col gap-6">
				{sensor === null ? (
					<AllSensorsUserOverview selectedUser={selectedUser} />
				) : sensor === "dust" ? (
					<DustUserChart selectedUser={selectedUser} />
				) : sensor === "noise" ? (
					<NoiseUserChart selectedUser={selectedUser} />
				) : (
					<VibrationUserChart selectedUser={selectedUser} />
				)}
			</div>
		</section>
	);
}

function AllSensorsUserOverview({ selectedUser }: { selectedUser: UserWithStatusDto }) {
	const { view } = useView();
	const { date } = useDate();

	const {
		data: response,
		isLoading,
		isError,
	} = useQuery(
		sensorOverviewQueryOptions({
			query: buildSensorOverviewQuery([...sensors], view, date),
			userId: selectedUser.id,
		}),
	);

	const data = response?.data;
	const hourDomain = response?.hourDomain;

	const { minHour, maxHour } = getHourDomain(
		hourDomain,
		data?.map((d) => d.time),
		"week", // The overview never shows linecharts so should always calculate hour domain with week padding
	);

	return (
		<SensorChartCard isLoading={isLoading} isError={isError} data={data} selectedDate={date}>
			{view === "week" ? (
				<WeekWidget
					dayStartHour={minHour}
					dayEndHour={maxHour}
					data={mapOverviewDataToTimeBucketStatuses(data ?? [])}
				/>
			) : (
				<DayWidget
					data={mapOverviewBucketsToChartRows(data ?? [], 0, 23)}
					startHour={minHour}
					endHour={maxHour}
					buildLink={(sensor, dateQueryParam) => {
						const params = new URLSearchParams();
						params.set("sensor", sensor);

						if (selectedUser?.id) {
							params.set("userId", selectedUser.id);
						}

						params.set("date", dateQueryParam);

						return `?${params.toString()}`;
					}}
				/>
			)}
		</SensorChartCard>
	);
}

function DustUserChart({ selectedUser }: { selectedUser: UserWithStatusDto }) {
	const { view } = useView();
	const { t, i18n } = useTranslation();
	const { exportToPDF } = useExportPDF();
	const formatDate = useFormatDate();
	const chartContainerId = useId();
	const sensor: Sensor = "dust";
	const [dustField, setDustField] = useQueryState<DustField>(
		"dustField",
		parseAsDustField.withDefault(defaultDustField),
	);
	const [dustUnit, setDustUnit] = useQueryState("unit", parseAsSensorUnit.withDefault("ug"));

	const { date } = useDate();

	const query = buildSensorQuery(sensor, view, date, {
		field: dustField,
	});

	const { data: overviewResponse } = useQuery(
		sensorOverviewQueryOptions({
			query: buildSensorOverviewQuery([sensor], view, date),
			userId: selectedUser.id,
		}),
	);
	const dustThreshold = getThreshold(sensor, query.field);
	const dustPm1TwaThreshold = getThreshold(sensor, "pm1_twa");
	const dustPm25TwaThreshold = getThreshold(sensor, "pm25_twa");
	const dustPm4TwaThreshold = getThreshold(sensor, "pm4_twa");
	const dustPm10TwaThreshold = getThreshold(sensor, "pm10_twa");

	const [dataResult, dustTwa1Result, dustTwa25Result, dustTwa4Result, dustTwa10Result] = useQueries({
		queries: [
			sensorQueryOptions({
				sensor,
				query,
				userId: selectedUser.id,
			}),
			sensorQueryOptions({
				sensor,
				query: buildSensorQuery(sensor, view, date, {
					granularity: "day",
					aggregationFunction: "avg",
					field: "pm1_twa",
				}),
				userId: selectedUser.id,
			}),
			sensorQueryOptions({
				sensor,
				query: buildSensorQuery(sensor, view, date, {
					granularity: "day",
					aggregationFunction: "avg",
					field: "pm25_twa",
				}),
				userId: selectedUser.id,
			}),
			sensorQueryOptions({
				sensor,
				query: buildSensorQuery(sensor, view, date, {
					granularity: "day",
					aggregationFunction: "avg",
					field: "pm4_twa",
				}),
				userId: selectedUser.id,
			}),
			sensorQueryOptions({
				sensor,
				query: buildSensorQuery(sensor, view, date, {
					granularity: "day",
					aggregationFunction: "avg",
					field: "pm10_twa",
				}),
				userId: selectedUser.id,
			}),
		],
	});

	const data = dataResult?.data?.data;
	const hourDomain = dataResult?.data?.hourDomain;
	const latestPoint = data?.at(-1) ?? null;
	const maxPoint = data && data.length > 0 ? getMaxPointByValue(data, (point) => point.value) : null;
	const averageValue =
		data && data.length > 0 ? data.reduce((sum, point) => sum + point.value, 0) / data.length : null;

	const avgDustTwa1Data = dustTwa1Result.data?.data ?? [];
	const avgDustTwa25Data = dustTwa25Result.data?.data ?? [];
	const avgDustTwa4Data = dustTwa4Result.data?.data ?? [];
	const avgDustTwa10Data = dustTwa10Result.data?.data ?? [];

	const avgPm1Twa = getAvgValue(avgDustTwa1Data);
	const avgPm4Twa = getAvgValue(avgDustTwa4Data);
	const avgPm25Twa = getAvgValue(avgDustTwa25Data);
	const avgPm10Twa = getAvgValue(avgDustTwa10Data);

	const maxValue = maxPoint?.value ?? 0;
	const minY = 0;
	let maxY = 45;
	if (maxValue > maxY) {
		maxY = computeYAxisRange(data ?? []).maxY;
	}
	const { minHour, maxHour } = getHourDomain(
		hourDomain,
		data?.map((d) => d.time),
		view,
	);

	const minTime = setHours(date, minHour);
	const maxTime = setHours(date, maxHour);

	const showTrendLineChart = view === "month" || view === "week";
	const showDustStatistics = view === "day";

	return (
		<div className="flex max-w-4xl flex-col gap-4">
			<Tabs value={dustField} onValueChange={(value) => setDustField(value as DustField)}>
				<TabsList>
					{dustFields.map((field) => (
						<TabsTrigger key={field} value={field}>
							{t(($) => $.sensors.dustFields[field])}
						</TabsTrigger>
					))}
				</TabsList>
			</Tabs>

			{showDustStatistics && (
				<SensorStatisticsSection
					isLoading={dataResult.isLoading}
					isEmpty={dataResult.isError || !data?.length}
					averageValue={averageValue}
					maxValue={maxPoint?.value ?? null}
					maxTime={maxPoint?.time ?? null}
					latestValue={latestPoint?.value ?? null}
					dangerThreshold={dustThreshold.danger}
					unit={dustUnit}
					formatTime={(time) => formatDate(time, "HH:mm")}
				/>
			)}

			<SensorChartCard
				isLoading={dataResult.isLoading}
				isError={dataResult.isError}
				data={data}
				selectedDate={date}
				isSensor={true}
			>
				{view === "week" ? (
					<WeekWidget
						dayStartHour={minHour}
						dayEndHour={maxHour}
						data={mapOverviewDataToTimeBucketStatuses(overviewResponse?.data ?? [])}
					/>
				) : (
					<div id={chartContainerId}>
						<ExposureLineChartCard
							minTime={minTime}
							maxTime={maxTime}
							chartData={downsampleSensorData(sensor, data ?? [])}
							unit={dustUnit}
							maxY={maxY}
							minY={minY}
							sensor={sensor}
							dustField={query.field}
							headerRight={
								<div className="flex items-center gap-2">
									<Tabs value={dustUnit} onValueChange={(v) => setDustUnit(v as SensorUnit)}>
										<TabsList>
											<TabsTrigger value="ug">{t(($) => $.sensors.units.ug)}</TabsTrigger>
											<TabsTrigger value="mg">{t(($) => $.sensors.units.mg)}</TabsTrigger>
										</TabsList>
									</Tabs>
									<ExportButton
										title={t(($) => $.common.exportAsPdf)}
										onClick={() =>
											exportToPDF(
												chartContainerId,
												`${formatChartDate(date, i18n.language)}-${selectedUser.name}-Dust-Exposure-Overview`,
												`${t(($) => $.pdf.dustExposure)} - ${selectedUser.name} - ${date.toLocaleDateString(i18n.language)}`,
											)
										}
									/>
								</div>
							}
						>
							<ThresholdLine y={dustThreshold.danger} dangerLevel="danger" />
							<ThresholdLine y={dustThreshold.warning} dangerLevel="warning" />
						</ExposureLineChartCard>
					</div>
				)}
			</SensorChartCard>

			<Card className="w-full">
				<CardHeader>
					<CardTitle>
						{t(($) => $.exposureSlider.title, {
							view: t(($) => $.views[view]).toLowerCase(),
						})}
					</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-row flex-wrap">
					<ExposureSlider
						className="flex-1"
						label={t(($) => $.sensors.dustExposureLabels.pm1_twa)}
						value={avgPm1Twa}
						sensor={sensor}
						unitLabel="ug"
						dangerLevel={getDangerLevel(avgPm1Twa, dustPm1TwaThreshold.warning, dustPm1TwaThreshold.danger)}
					/>
					<ExposureSlider
						className="flex-1"
						label={t(($) => $.sensors.dustExposureLabels.pm25_twa)}
						value={avgPm25Twa}
						sensor={sensor}
						unitLabel="ug"
						dangerLevel={getDangerLevel(
							avgPm25Twa,
							dustPm25TwaThreshold.warning,
							dustPm25TwaThreshold.danger,
						)}
					/>
					<ExposureSlider
						className="flex-1"
						label={t(($) => $.sensors.dustExposureLabels.pm4_twa)}
						value={avgPm4Twa}
						sensor={sensor}
						unitLabel="ug"
						dangerLevel={getDangerLevel(avgPm4Twa, dustPm4TwaThreshold.warning, dustPm4TwaThreshold.danger)}
					/>
					<ExposureSlider
						className="flex-1"
						label={t(($) => $.sensors.dustExposureLabels.pm10_twa)}
						value={avgPm10Twa}
						sensor={sensor}
						unitLabel="ug"
						dangerLevel={getDangerLevel(
							avgPm10Twa,
							dustPm10TwaThreshold.warning,
							dustPm10TwaThreshold.danger,
						)}
					/>
				</CardContent>
			</Card>

			{showTrendLineChart && <DustTrendLineChartCard unit={dustUnit} userId={selectedUser.id} />}
		</div>
	);
}

function VibrationUserChart({ selectedUser }: { selectedUser: UserWithStatusDto }) {
	const { view } = useView();
	const { date } = useDate();
	const { t, i18n } = useTranslation();
	const { exportToPDF } = useExportPDF();
	const formatDate = useFormatDate();
	const chartContainerId = useId();
	const sensor: Sensor = "vibration";
	const vibrationThreshold = getThreshold(sensor);

	const query = buildSensorQuery(sensor, view, date);

	const { data: overviewResponse } = useQuery(
		sensorOverviewQueryOptions({
			query: buildSensorOverviewQuery([sensor], view, date),
			userId: selectedUser.id,
		}),
	);

	const {
		data: response,
		isLoading,
		isError,
	} = useQuery(
		sensorQueryOptions({
			sensor,
			query,
			userId: selectedUser.id,
		}),
	);

	const data = response?.data;
	const hourDomain = response?.hourDomain;
	const latestPoint = data?.at(-1) ?? null;
	const maxPoint = data && data.length > 0 ? getMaxPointByValue(data, (point) => point.value) : null;
	const averageValue =
		data && data.length > 0 ? data.reduce((sum, point) => sum + point.value, 0) / data.length : null;

	const maxValue = maxPoint?.value ?? 0;
	const minY = 0;
	let maxY = 450;
	if (maxValue > maxY) {
		maxY = computeYAxisRange(data ?? []).maxY;
	}
	const { minHour, maxHour } = getHourDomain(
		hourDomain,
		data?.map((d) => d.time),
		view,
	);

	const minTime = setHours(date, minHour);
	const maxTime = setHours(date, maxHour);

	const showTrendLineChart = view === "month" || view === "week";
	const showVibrationStatistics = view === "day";

	return (
		<div className="flex flex-col gap-4">
			{showVibrationStatistics && (
				<SensorStatisticsSection
					isLoading={isLoading}
					isEmpty={isError || !data?.length}
					averageValue={averageValue}
					maxValue={maxPoint?.value ?? null}
					maxTime={maxPoint?.time ?? null}
					latestValue={latestPoint?.value ?? null}
					dangerThreshold={vibrationThreshold.danger}
					unit="points"
					formatTime={(time) => formatDate(time, "HH:mm")}
				/>
			)}

			<SensorChartCard isLoading={isLoading} isError={isError} data={data} selectedDate={date} isSensor={true}>
				{view === "week" ? (
					<WeekWidget
						dayStartHour={minHour}
						dayEndHour={maxHour}
						data={mapOverviewDataToTimeBucketStatuses(overviewResponse?.data ?? [])}
					/>
				) : (
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
											`${formatChartDate(date, i18n.language)}-${selectedUser.name}-Vibration-Exposure-Overview`,
											`${t(($) => $.pdf.vibrationExposure)} - ${selectedUser.name} - ${date.toLocaleDateString(i18n.language)}`,
										)
									}
								/>
							}
						>
							<ThresholdLine y={vibrationThreshold.danger} dangerLevel="danger" />
							<ThresholdLine y={vibrationThreshold.warning} dangerLevel="warning" />
						</ExposureLineChartCard>
					</div>
				)}
			</SensorChartCard>
			{showTrendLineChart && <VibrationTrendLineChartCard userId={selectedUser.id} />}
		</div>
	);
}

function NoiseUserChart({ selectedUser }: { selectedUser: UserWithStatusDto }) {
	const { view } = useView();
	const { date } = useDate();
	const { t, i18n } = useTranslation();
	const { exportToPDF } = useExportPDF();
	const formatDate = useFormatDate();
	const chartContainerId = useId();
	const sensor: Sensor = "noise";
	const parseAsAggregation = parseAsStringLiteral(Aggregations);
	const [aggregation, setAggregation] = useQueryState<Aggregation>(
		"aggregation",
		parseAsAggregation.withDefault("average"),
	);
	const usePeakAggregation = aggregation === "peak";
	const noiseThreshold = getThreshold(sensor);
	const noiseDangerThreshold = usePeakAggregation
		? (noiseThreshold.peakDanger ?? noiseThreshold.danger)
		: noiseThreshold.danger;

	const query = buildSensorQuery(sensor, view, date, {
		usePeakAggregation,
	});

	const { data: overviewResponse } = useQuery(
		sensorOverviewQueryOptions({
			query: buildSensorOverviewQuery([sensor], view, date),
			userId: selectedUser.id,
		}),
	);

	const {
		data: response,
		isLoading,
		isError,
	} = useQuery(
		sensorQueryOptions({
			sensor,
			query,
			userId: selectedUser.id,
		}),
	);

	const data = response?.data;
	const hourDomain = response?.hourDomain;
	const latestPoint = data?.at(-1) ?? null;
	const maxPoint =
		data && data.length > 0
			? getMaxPointByValue(data, (point) => getDisplayedNoiseValue(point, usePeakAggregation))
			: null;
	const averageValue =
		data && data.length > 0
			? data.reduce((sum, point) => sum + getDisplayedNoiseValue(point, usePeakAggregation), 0) / data.length
			: null;

	const maxValue = maxPoint ? getDisplayedNoiseValue(maxPoint, usePeakAggregation) : 0;
	const minY = 0;
	let maxY = 150;
	if (maxValue > maxY) {
		maxY = computeYAxisRange(data ?? [], {
			step: usePeakAggregation ? 130 : undefined,
		}).maxY;
	}
	const { minHour, maxHour } = getHourDomain(
		hourDomain,
		data?.map((d) => d.time),
		view,
	);

	const minTime = setHours(date, minHour);
	const maxTime = setHours(date, maxHour);

	const showTrendLineChart = view === "month" || view === "week";
	const showNoiseStatistics = view === "day";

	return (
		<div className="flex max-w-4xl flex-col gap-4">
			<Tabs value={aggregation} onValueChange={(value) => setAggregation(value as Aggregation)}>
				<TabsList>
					<TabsTrigger value="average">{t(($) => $.measurement.average)}</TabsTrigger>
					<TabsTrigger value="peak">{t(($) => $.measurement.peak)}</TabsTrigger>
				</TabsList>
			</Tabs>
			{showNoiseStatistics && (
				<SensorStatisticsSection
					isLoading={isLoading}
					isEmpty={isError || !data?.length}
					averageValue={averageValue}
					maxValue={maxPoint ? getDisplayedNoiseValue(maxPoint, usePeakAggregation) : null}
					maxTime={maxPoint?.time ?? null}
					latestValue={latestPoint ? getDisplayedNoiseValue(latestPoint, usePeakAggregation) : null}
					dangerThreshold={noiseDangerThreshold}
					unit="dbTwa"
					formatTime={(time) => formatDate(time, "HH:mm")}
				/>
			)}
			<SensorChartCard isLoading={isLoading} isError={isError} data={data} selectedDate={date} isSensor={true}>
				{view === "week" ? (
					<WeekWidget
						dayStartHour={minHour}
						dayEndHour={maxHour}
						data={mapOverviewDataToTimeBucketStatuses(overviewResponse?.data ?? [])}
					/>
				) : (
					<div id={chartContainerId}>
						<ExposureLineChartCard
							minTime={minTime}
							maxTime={maxTime}
							usePeakData={usePeakAggregation}
							chartData={downsampleSensorData(sensor, data ?? [])}
							unit="dbTwa"
							maxY={maxY}
							minY={minY}
							sensor={sensor}
							headerRight={
								<ExportButton
									title={t(($) => $.common.exportAsPdf)}
									onClick={() =>
										exportToPDF(
											chartContainerId,
											`${formatChartDate(date, i18n.language)}-${selectedUser.name}-Noise-Exposure-Overview`,
											`${t(($) => $.pdf.noiseExposure)} - ${selectedUser.name} - ${date.toLocaleDateString(i18n.language)}`,
										)
									}
								/>
							}
						>
							<ThresholdLine
								y={
									usePeakAggregation
										? (noiseThreshold.peakDanger ?? noiseThreshold.danger)
										: noiseThreshold.danger
								}
								dangerLevel="danger"
							/>
							{!usePeakAggregation && <ThresholdLine y={noiseThreshold.warning} dangerLevel="warning" />}
						</ExposureLineChartCard>
					</div>
				)}
			</SensorChartCard>
			{showTrendLineChart && <NoiseTrendLineChartCard userId={selectedUser.id} />}
		</div>
	);
}

function getDisplayedNoiseValue(point: SensorDto, usePeakAggregation: boolean) {
	return usePeakAggregation && point.peakValue != null ? point.peakValue : point.value;
}

function SensorChartCard({
	isLoading,
	isError,
	data,
	isSensor,
	selectedDate,
	children,
}: {
	isLoading: boolean;
	isError: boolean;
	data: Array<SensorDto> | Array<SensorOverviewBucketDto> | undefined;
	isSensor?: boolean;
	selectedDate: TZDate;
	children: ReactNode;
}) {
	const { t, i18n } = useTranslation();

	if (isLoading && isSensor) {
		return <ExposureLineChartCardSkeleton />;
	}

	if (isLoading) {
		return (
			<Card className="flex w-full items-center">
				<p>{t(($) => $.common.loading)}</p>
			</Card>
		);
	}

	if (isError) {
		return (
			<Card className="flex w-full items-center">
				<p>{t(($) => $.common.error)}</p>
			</Card>
		);
	}

	if (!data || data.length === 0) {
		return (
			<Card className="flex w-full items-center">
				<CardTitle>{formatChartDate(selectedDate, i18n.language)}</CardTitle>
				<p>{t(($) => $.common.noData)}</p>
			</Card>
		);
	}

	return <div className="w-full max-w-4xl">{children}</div>;
}

function formatChartDate(selectedDate: TZDate, locale: string) {
	return selectedDate.toLocaleDateString(locale, {
		day: "numeric",
		month: "long",
		year: "numeric",
	});
}

function getAvgValue(data: Array<SensorDto>): number {
	if (data.length === 0) {
		return 0;
	}

	const sum = data.reduce((acc, point) => acc + point.value, 0);
	return sum / data.length;
}
