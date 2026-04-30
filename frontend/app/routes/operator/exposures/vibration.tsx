import { CalendarWidget } from "@/features/calendar-widget/calendar-widget";
import { useDate } from "@/features/date-picker/use-date";
import { ExposureLineChartCardSkeleton } from "@/features/exposure-line-chart-card/base-exposure-line-chart-card";
import VibrationExposureLineChartCard from "@/features/exposure-line-chart-card/vibration-exposure-line-chart-card";
import { ExposureGraphEmptyState, ExposureStatisticsSection } from "@/features/statistic-card";
import { getMaxPointByValue } from "@/features/statistic-card-utils";
import { VibrationTrendLineChartCard } from "@/features/trend-line-chart-card/vibration-trend-line-chart-card";
import { useUser } from "@/features/user/user-context";
import { parseAsView } from "@/features/views/utils";
import { WeekWidget } from "@/features/week-widget/week-widget";
import { useFormatDate } from "@/hooks/use-format-date";
import { exposureQueryOptions } from "@/lib/api";
import { buildExposureQuery } from "@/lib/exposure-query-utils";
import type { Exposure } from "@/lib/exposures";
import { getThreshold } from "@/lib/thresholds";
import { mapExposureDataToTimeBucketStatuses } from "@/lib/time-bucket-utils";
import { computeYAxisRange, getHourDomain } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useQueryState } from "nuqs";
import { useTranslation } from "react-i18next";

export default function Vibration() {
	const [view] = useQueryState("view", parseAsView.withDefault("day"));
	const { i18n } = useTranslation();
	const formatDate = useFormatDate();

	const { date } = useDate();
	const { user } = useUser();

	const exposure: Exposure = "vibration";
	const vibrationThreshold = getThreshold(exposure);

	const query = buildExposureQuery(exposure, view, date);

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
	const maxPoint = data && data.length > 0 ? getMaxPointByValue(data, (point) => point.value) : null;

	const { minHour, maxHour } = getHourDomain(
		hourDomain,
		data?.map((d) => d.time),
		view,
	);

	const maxValue = data ? Math.max(...data.map((d) => d.value)) : 0;

	let maxY = 450;
	if (maxValue > maxY) {
		maxY = computeYAxisRange(data ?? []).maxY;
	}

	const calendarData = mapExposureDataToTimeBucketStatuses(data ?? [], "vibration", false);

	const showTrendLineChart = view === "month" || view === "week";
	const showVibrationStatistics = view === "day";

	return (
		<div className="flex flex-col gap-16">
			<div className="flex h-full w-full flex-col-reverse gap-4 md:flex-row">
				<div className="flex flex-1 flex-col gap-4">
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
						<VibrationExposureLineChartCard />
					)}

					{showVibrationStatistics && (
						<ExposureStatisticsSection
							isLoading={isLoading}
							isEmpty={isError || !data?.length}
							averageValue={null}
							maxValue={maxPoint?.value ?? null}
							maxTime={null}
							latestValue={null}
							warningThreshold={vibrationThreshold.warning}
							dangerThreshold={vibrationThreshold.danger}
							unit="points"
							formatTime={(time) => formatDate(time, "HH:mm")}
						/>
					)}
				</div>
			</div>
			{showTrendLineChart && <VibrationTrendLineChartCard />}
		</div>
	);
}
