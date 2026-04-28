import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarWidget } from "@/features/calendar-widget/calendar-widget";
import { useDate } from "@/features/date-picker/use-date";
import { ExposureLineChartCardSkeleton } from "@/features/exposure-line-chart-card/base-exposure-line-chart-card";
import NoiseExposureLineChartCard from "@/features/exposure-line-chart-card/noise-exposure-line-chart-card";
import { ExposureGraphEmptyState, ExposureStatisticsSection } from "@/features/statistic-card";
import { getMaxPointByValue } from "@/features/statistic-card-utils";
import { NoiseTrendLineChartCard } from "@/features/trend-line-chart-card/noise-trend-line-chart-card";
import { useUser } from "@/features/user/user-context";
import { useView } from "@/features/views/use-view";
import { WeekWidget } from "@/features/week-widget/week-widget";
import { useFormatDate } from "@/hooks/use-format-date";
import { exposureQueryOptions } from "@/lib/api";
import { type Aggregation, Aggregations, type ExposureDto } from "@/lib/dto";
import { buildExposureQuery } from "@/lib/exposure-query-utils";
import type { Exposure } from "@/lib/exposures";
import { getThreshold } from "@/lib/thresholds";
import { mapExposureDataToTimeBucketStatuses } from "@/lib/time-bucket-utils";
import { computeYAxisRange, getHourDomain } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useTranslation } from "react-i18next";

export default function Noise() {
	const { view } = useView();
	const { t, i18n } = useTranslation();
	const formatDate = useFormatDate();

	const { date } = useDate();
	const { user } = useUser();

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

	const {
		data: response,
		isLoading,
		isError,
	} = useQuery(
		exposureQueryOptions({
			exposure,
			query,
			userId: user.id,
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

	const { minHour, maxHour } = getHourDomain(
		hourDomain,
		data?.map((d) => d.time),
		view,
	);

	const maxValue = maxPoint ? getDisplayedNoiseValue(maxPoint, usePeakAggregation) : 0;

	let maxY = 150;
	if (maxValue > maxY) {
		maxY = computeYAxisRange(data ?? [], {
			step: usePeakAggregation ? 130 : undefined,
		}).maxY;
	}

	const calendarData = mapExposureDataToTimeBucketStatuses(data ?? [], exposure, usePeakAggregation);

	const showTrendLineChart = view === "month" || view === "week";
	const showNoiseStatistics = view === "day";

	return (
		<div className="flex flex-col gap-16">
			<div className="flex flex-1 flex-col gap-4">
				<Tabs value={aggregation} onValueChange={(value) => setAggregation(value as Aggregation)}>
					<TabsList>
						<TabsTrigger value="average">{t(($) => $.measurement.average)}</TabsTrigger>
						<TabsTrigger value="peak">{t(($) => $.measurement.peak)}</TabsTrigger>
					</TabsList>
				</Tabs>

				{isLoading ? (
					<ExposureLineChartCardSkeleton />
				) : isError ? (
					<ExposureGraphEmptyState date={date} locale={i18n.language} />
				) : view === "month" ? (
					<CalendarWidget selectedDay={date} data={calendarData} />
				) : view === "week" ? (
					<WeekWidget dayStartHour={minHour} dayEndHour={maxHour} data={calendarData} />
				) : !data || data.length === 0 ? (
					<ExposureGraphEmptyState date={date} locale={i18n.language} />
				) : (
					<NoiseExposureLineChartCard />
				)}

				{showNoiseStatistics && (
					<ExposureStatisticsSection
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
			</div>
			{showTrendLineChart && <NoiseTrendLineChartCard usePeakAggregation={usePeakAggregation} />}
		</div>
	);
}

function getDisplayedNoiseValue(point: ExposureDto, usePeakAggregation: boolean) {
	return usePeakAggregation && point.peakValue != null ? point.peakValue : point.value;
}
