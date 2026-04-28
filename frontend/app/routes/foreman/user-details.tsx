import { ExposureSlider } from "@/components/exposure-slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDate } from "@/features/date-picker/use-date";
import { DayWidget } from "@/features/day-widget/day-widget";
import { ExposureLineChartCardSkeleton } from "@/features/exposure-line-chart-card/base-exposure-line-chart-card";
import { DustExposureLineChartCard } from "@/features/exposure-line-chart-card/dust-exposure-line-chart-card";
import NoiseExposureLineChartCard from "@/features/exposure-line-chart-card/noise-exposure-line-chart-card";
import VibrationExposureLineChartCard from "@/features/exposure-line-chart-card/vibration-exposure-line-chart-card";
import { ExposureStatisticsSection } from "@/features/statistic-card";
import { getMaxPointByValue } from "@/features/statistic-card-utils";
import { DustTrendLineChartCard } from "@/features/trend-line-chart-card/dust-trend-line-chart-card";
import { NoiseTrendLineChartCard } from "@/features/trend-line-chart-card/noise-trend-line-chart-card";
import { VibrationTrendLineChartCard } from "@/features/trend-line-chart-card/vibration-trend-line-chart-card";
import { useView } from "@/features/views/use-view";
import { WeekWidget } from "@/features/week-widget/week-widget";
import { useFormatDate } from "@/hooks/use-format-date";
import { exposureOverviewQueryOptions, exposureQueryOptions } from "@/lib/api";
import { getDangerLevel } from "@/lib/danger-levels";
import {
	type Aggregation,
	Aggregations,
	type ExposureDto,
	type ExposureOverviewBucketDto,
	type UserWithStatusDto,
} from "@/lib/dto";
import { buildExposureOverviewQuery, buildExposureQuery } from "@/lib/exposure-query-utils";
import {
	type DustField,
	defaultDustField,
	dustFields,
	type Exposure,
	exposures,
	parseAsDustField,
	parseAsExposureUnit,
} from "@/lib/exposures";
import { getThreshold } from "@/lib/thresholds";
import { mapOverviewBucketsToChartRows, mapOverviewDataToTimeBucketStatuses } from "@/lib/time-bucket-utils";
import { computeYAxisRange, DUST_Y_AXIS_STEP, getHourDomain } from "@/lib/utils";
import type { TZDate } from "@date-fns/tz";
import { useQueries, useQuery } from "@tanstack/react-query";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

export function UserDetails({
	selectedUser,
	exposure,
}: {
	selectedUser: UserWithStatusDto;
	exposure: Exposure | null;
}) {
	return (
		<section className="flex flex-col gap-6">
			<div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
				<div className="space-y-1">
					<h2 className="font-semibold text-2xl">{selectedUser.name}</h2>
					<p className="text-muted-foreground">{selectedUser.email}</p>
				</div>
			</div>

			<div className="flex flex-col gap-6">
				{exposure === null ? (
					<AllExposuresUserOverview selectedUser={selectedUser} />
				) : exposure === "dust" ? (
					<DustUserChart selectedUser={selectedUser} />
				) : exposure === "noise" ? (
					<NoiseUserChart selectedUser={selectedUser} />
				) : (
					<VibrationUserChart selectedUser={selectedUser} />
				)}
			</div>
		</section>
	);
}

function AllExposuresUserOverview({ selectedUser }: { selectedUser: UserWithStatusDto }) {
	const { view } = useView();
	const { date } = useDate();

	const {
		data: response,
		isLoading,
		isError,
	} = useQuery(
		exposureOverviewQueryOptions({
			query: buildExposureOverviewQuery([...exposures], view, date),
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
		<ExposureChartCard isLoading={isLoading} isError={isError} data={data} selectedDate={date}>
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
					buildLink={(exposure, dateQueryParam) => {
						const params = new URLSearchParams();
						params.set("exposure", exposure);

						if (selectedUser?.id) {
							params.set("userId", selectedUser.id);
						}

						params.set("date", dateQueryParam);

						return `?${params.toString()}`;
					}}
				/>
			)}
		</ExposureChartCard>
	);
}

function DustUserChart({ selectedUser }: { selectedUser: UserWithStatusDto }) {
	const { view } = useView();
	const { t } = useTranslation();
	const formatDate = useFormatDate();
	const exposure: Exposure = "dust";
	const [dustField, setDustField] = useQueryState<DustField>(
		"dustField",
		parseAsDustField.withDefault(defaultDustField),
	);
	const [dustUnit] = useQueryState("unit", parseAsExposureUnit.withDefault("ug"));

	const { date } = useDate();

	const query = buildExposureQuery(exposure, view, date, {
		field: dustField,
	});

	const { data: overviewResponse } = useQuery(
		exposureOverviewQueryOptions({
			query: buildExposureOverviewQuery([exposure], view, date),
			userId: selectedUser.id,
		}),
	);
	const dustThreshold = getThreshold(exposure, query.field);
	const dustPm1TwaThreshold = getThreshold(exposure, "pm1_twa");
	const dustPm25TwaThreshold = getThreshold(exposure, "pm25_twa");
	const dustPm4TwaThreshold = getThreshold(exposure, "pm4_twa");
	const dustPm10TwaThreshold = getThreshold(exposure, "pm10_twa");

	const [dataResult, dustTwa1Result, dustTwa25Result, dustTwa4Result, dustTwa10Result] = useQueries({
		queries: [
			exposureQueryOptions({
				exposure,
				query,
				userId: selectedUser.id,
			}),
			exposureQueryOptions({
				exposure,
				query: buildExposureQuery(exposure, view, date, {
					granularity: "day",
					aggregationFunction: "avg",
					field: "pm1_twa",
				}),
				userId: selectedUser.id,
			}),
			exposureQueryOptions({
				exposure,
				query: buildExposureQuery(exposure, view, date, {
					granularity: "day",
					aggregationFunction: "avg",
					field: "pm25_twa",
				}),
				userId: selectedUser.id,
			}),
			exposureQueryOptions({
				exposure,
				query: buildExposureQuery(exposure, view, date, {
					granularity: "day",
					aggregationFunction: "avg",
					field: "pm4_twa",
				}),
				userId: selectedUser.id,
			}),
			exposureQueryOptions({
				exposure,
				query: buildExposureQuery(exposure, view, date, {
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
	let maxY = 45;
	if (maxValue > maxY) {
		maxY = computeYAxisRange(data ?? [], {
			step: DUST_Y_AXIS_STEP,
			topPadding: DUST_Y_AXIS_STEP,
		}).maxY;
	}
	const { minHour, maxHour } = getHourDomain(
		hourDomain,
		data?.map((d) => d.time),
		view,
	);

	const showTrendLineChart = view === "month" || view === "week";
	const showDustStatistics = view === "day";

	return (
		<div className="flex max-w-4xl flex-col gap-4">
			<Tabs value={dustField} onValueChange={(value) => setDustField(value as DustField)}>
				<TabsList>
					{dustFields.map((field) => (
						<TabsTrigger key={field} value={field}>
							{t(($) => $.exposures.dustFields[field])}
						</TabsTrigger>
					))}
				</TabsList>
			</Tabs>

			{showDustStatistics && (
				<ExposureStatisticsSection
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

			<ExposureChartCard
				isLoading={dataResult.isLoading}
				isError={dataResult.isError}
				data={data}
				selectedDate={date}
				isExposure={true}
			>
				{view === "week" ? (
					<WeekWidget
						dayStartHour={minHour}
						dayEndHour={maxHour}
						data={mapOverviewDataToTimeBucketStatuses(overviewResponse?.data ?? [])}
					/>
				) : (
					<DustExposureLineChartCard userId={selectedUser.id} />
				)}
			</ExposureChartCard>

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
						label={t(($) => $.exposures.dustFields.pm1_twa)}
						value={avgPm1Twa}
						exposure={exposure}
						unitLabel="ug"
						dangerLevel={getDangerLevel(avgPm1Twa, dustPm1TwaThreshold.warning, dustPm1TwaThreshold.danger)}
					/>
					<ExposureSlider
						className="flex-1"
						label={t(($) => $.exposures.dustFields.pm25_twa)}
						value={avgPm25Twa}
						exposure={exposure}
						unitLabel="ug"
						dangerLevel={getDangerLevel(
							avgPm25Twa,
							dustPm25TwaThreshold.warning,
							dustPm25TwaThreshold.danger,
						)}
					/>
					<ExposureSlider
						className="flex-1"
						label={t(($) => $.exposures.dustFields.pm4_twa)}
						value={avgPm4Twa}
						exposure={exposure}
						unitLabel="ug"
						dangerLevel={getDangerLevel(avgPm4Twa, dustPm4TwaThreshold.warning, dustPm4TwaThreshold.danger)}
					/>
					<ExposureSlider
						className="flex-1"
						label={t(($) => $.exposures.dustFields.pm10_twa)}
						value={avgPm10Twa}
						exposure={exposure}
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
	const formatDate = useFormatDate();
	const exposure: Exposure = "vibration";
	const vibrationThreshold = getThreshold(exposure);

	const query = buildExposureQuery(exposure, view, date);

	const { data: overviewResponse } = useQuery(
		exposureOverviewQueryOptions({
			query: buildExposureOverviewQuery([exposure], view, date),
			userId: selectedUser.id,
		}),
	);

	const {
		data: response,
		isLoading,
		isError,
	} = useQuery(
		exposureQueryOptions({
			exposure,
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
	let maxY = 450;
	if (maxValue > maxY) {
		maxY = computeYAxisRange(data ?? []).maxY;
	}
	const { minHour, maxHour } = getHourDomain(
		hourDomain,
		data?.map((d) => d.time),
		view,
	);

	const showTrendLineChart = view === "month" || view === "week";
	const showVibrationStatistics = view === "day";

	return (
		<div className="flex flex-col gap-4">
			{showVibrationStatistics && (
				<ExposureStatisticsSection
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

			<ExposureChartCard
				isLoading={isLoading}
				isError={isError}
				data={data}
				selectedDate={date}
				isExposure={true}
			>
				{view === "week" ? (
					<WeekWidget
						dayStartHour={minHour}
						dayEndHour={maxHour}
						data={mapOverviewDataToTimeBucketStatuses(overviewResponse?.data ?? [])}
					/>
				) : (
					<VibrationExposureLineChartCard userId={selectedUser.id} />
				)}
			</ExposureChartCard>
			{showTrendLineChart && <VibrationTrendLineChartCard userId={selectedUser.id} />}
		</div>
	);
}

function NoiseUserChart({ selectedUser }: { selectedUser: UserWithStatusDto }) {
	const { view } = useView();
	const { date } = useDate();
	const { t } = useTranslation();
	const formatDate = useFormatDate();
	const exposure: Exposure = "noise";
	const parseAsAggregation = parseAsStringLiteral(Aggregations);
	const [aggregation, setAggregation] = useQueryState<Aggregation>(
		"aggregation",
		parseAsAggregation.withDefault("average"),
	);
	const usePeakAggregation = aggregation === "peak";
	const noiseThreshold = getThreshold(exposure);
	const noiseDangerThreshold = usePeakAggregation
		? (noiseThreshold.peakDanger ?? noiseThreshold.danger)
		: noiseThreshold.danger;

	const query = buildExposureQuery(exposure, view, date, {
		usePeakAggregation,
	});

	const { data: overviewResponse } = useQuery(
		exposureOverviewQueryOptions({
			query: buildExposureOverviewQuery([exposure], view, date),
			userId: selectedUser.id,
		}),
	);

	const {
		data: response,
		isLoading,
		isError,
	} = useQuery(
		exposureQueryOptions({
			exposure,
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
				<ExposureStatisticsSection
					isLoading={isLoading}
					isEmpty={isError || !data?.length}
					averageValue={averageValue}
					maxValue={maxPoint ? getDisplayedNoiseValue(maxPoint, usePeakAggregation) : null}
					maxTime={maxPoint?.time ?? null}
					latestValue={latestPoint ? getDisplayedNoiseValue(latestPoint, usePeakAggregation) : null}
					dangerThreshold={noiseDangerThreshold}
					unit="db"
					formatTime={(time) => formatDate(time, "HH:mm")}
				/>
			)}
			<ExposureChartCard
				isLoading={isLoading}
				isError={isError}
				data={data}
				selectedDate={date}
				isExposure={true}
			>
				{view === "week" ? (
					<WeekWidget
						dayStartHour={minHour}
						dayEndHour={maxHour}
						data={mapOverviewDataToTimeBucketStatuses(overviewResponse?.data ?? [])}
					/>
				) : (
					<NoiseExposureLineChartCard userId={selectedUser.id} />
				)}
			</ExposureChartCard>
			{showTrendLineChart && <NoiseTrendLineChartCard userId={selectedUser.id} />}
		</div>
	);
}

function getDisplayedNoiseValue(point: ExposureDto, usePeakAggregation: boolean) {
	return usePeakAggregation && point.peakValue != null ? point.peakValue : point.value;
}

function ExposureChartCard({
	isLoading,
	isError,
	data,
	isExposure,
	selectedDate,
	children,
}: {
	isLoading: boolean;
	isError: boolean;
	data: Array<ExposureDto> | Array<ExposureOverviewBucketDto> | undefined;
	isExposure?: boolean;
	selectedDate: TZDate;
	children: ReactNode;
}) {
	const { t, i18n } = useTranslation();

	if (isLoading && isExposure) {
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

function getAvgValue(data: Array<ExposureDto>): number {
	if (data.length === 0) {
		return 0;
	}

	const sum = data.reduce((acc, point) => acc + point.value, 0);
	return sum / data.length;
}
