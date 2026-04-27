import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarWidget } from "@/features/calendar-widget/calendar-widget";
import { useDate } from "@/features/date-picker/use-date";
import { ExposureLineChartCardSkeleton } from "@/features/exposure-line-chart-card/base-exposure-line-chart-card";
import { DustExposureLineChartCard } from "@/features/exposure-line-chart-card/dust-exposure-line-chart-card";
import { ExposureGraphEmptyState, ExposureStatisticsSection } from "@/features/statistic-card";
import { getMaxPointByValue } from "@/features/statistic-card-utils";
import { DustTrendLineChartCard } from "@/features/trend-line-chart-card/dust-trend-line-chart-card";
import { useUser } from "@/features/user/user-context";
import { useView } from "@/features/views/use-view";
import { WeekWidget } from "@/features/week-widget/week-widget";
import { useFormatDate } from "@/hooks/use-format-date";
import { exposureQueryOptions } from "@/lib/api";
import { buildExposureQuery } from "@/lib/exposure-query-utils";
import {
	type DustField,
	defaultDustField,
	dustFields,
	parseAsDustField,
	parseAsExposureUnit,
	type Exposure,
} from "@/lib/exposures";
import { getThreshold } from "@/lib/thresholds";
import { mapExposureDataToTimeBucketStatuses } from "@/lib/time-bucket-utils";
import { getHourDomain } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useQueryState } from "nuqs";
import { useTranslation } from "react-i18next";

export default function Dust() {
	const { view } = useView();
	const { date } = useDate();
	const { t, i18n } = useTranslation();
	const formatDate = useFormatDate();
	const locale = i18n.language;
	const { user } = useUser();

	const [dustField, setDustField] = useQueryState<DustField>(
		"dustField",
		parseAsDustField.withDefault(defaultDustField),
	);
	const [dustUnit] = useQueryState("unit", parseAsExposureUnit.withDefault("ug"));

	const exposure: Exposure = "dust";

	const query = buildExposureQuery(exposure, view, date, {
		field: dustField,
	});

	const dustThreshold = getThreshold(exposure, query.field);

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
	const maxPoint = data && data.length > 0 ? getMaxPointByValue(data, (point) => point.value) : null;
	const averageValue =
		data && data.length > 0 ? data.reduce((sum, point) => sum + point.value, 0) / data.length : null;

	const calendarData = mapExposureDataToTimeBucketStatuses(data ?? [], exposure, false);
	const { minHour, maxHour } = getHourDomain(hourDomain, data?.map((d) => d.time) ?? [], view);

	const showTrendLineChart = view === "month" || view === "week";
	const showDustStatistics = view === "day";

	return (
		<div className="flex flex-col gap-16">
			<div className="flex flex-1 flex-col gap-4">
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
						isLoading={isLoading}
						isEmpty={isError || data?.length === 0}
						averageValue={averageValue}
						maxValue={maxPoint?.value ?? null}
						maxTime={maxPoint?.time ?? null}
						latestValue={latestPoint?.value ?? null}
						dangerThreshold={dustThreshold.danger}
						unit={dustUnit}
						formatTime={(time) => formatDate(time, "HH:mm")}
					/>
				)}

				{isLoading ? (
					<ExposureLineChartCardSkeleton />
				) : isError ? (
					<ExposureGraphEmptyState date={date} locale={locale} />
				) : view === "month" ? (
					<CalendarWidget selectedDay={date} data={calendarData} />
				) : view === "week" ? (
					<WeekWidget dayStartHour={minHour} dayEndHour={maxHour} data={calendarData} />
				) : !data || data.length === 0 ? (
					<ExposureGraphEmptyState date={date} locale={locale} />
				) : (
					<DustExposureLineChartCard />
				)}
			</div>
			{showTrendLineChart && <DustTrendLineChartCard unit={dustUnit} />}
		</div>
	);
}
