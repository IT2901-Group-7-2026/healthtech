import { ExportButton } from "@/components/export-button";
import {
	ExposureLineChartCard,
	ExposureLineChartCardSkeleton,
} from "@/components/exposure-line-chart/exposure-line-chart-card";
import { ThresholdLine } from "@/components/exposure-line-chart/threshold-line";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarWidget } from "@/features/calendar-widget/calendar-widget";
import { useDate } from "@/features/date-picker/use-date";
import { SensorGraphEmptyState, SensorStatisticsSection } from "@/features/statistic-card";
import { getMaxPointByValue } from "@/features/statistic-card-utils";
import { DustTrendLineChartCard } from "@/features/trend-line-chart-card/dust-trend-line-chart-card";
import { useUser } from "@/features/user/user-context";
import { useView } from "@/features/views/use-view";
import { WeekWidget } from "@/features/week-widget/week-widget";
import { useExportPDF } from "@/hooks/use-export-pdf";
import { useFormatDate } from "@/hooks/use-format-date";
import { sensorQueryOptions } from "@/lib/api";
import { buildSensorQuery } from "@/lib/sensor-query-utils";
import {
	type DustField,
	defaultDustField,
	dustFields,
	parseAsDustField,
	parseAsSensorUnit,
	type Sensor,
	type SensorUnit,
} from "@/lib/sensors";
import { getThreshold } from "@/lib/thresholds";
import { mapSensorDataToTimeBucketStatuses } from "@/lib/time-bucket-utils";
import { computeYAxisRange, downsampleSensorData, getHourDomain } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { setHours } from "date-fns";
import { useQueryState } from "nuqs";
import { useId } from "react";
import { useTranslation } from "react-i18next";

export default function Dust() {
	const { view } = useView();
	const { date } = useDate();
	const { t, i18n } = useTranslation();
	const formatDate = useFormatDate();
	const locale = i18n.language;
	const { user } = useUser();
	const { exportToPDF } = useExportPDF();
	const chartContainerId = useId();

	const [dustField, setDustField] = useQueryState<DustField>(
		"dustField",
		parseAsDustField.withDefault(defaultDustField),
	);
	const [dustUnit, setDustUnit] = useQueryState("unit", parseAsSensorUnit.withDefault("ug"));

	const sensor: Sensor = "dust";

	const query = buildSensorQuery(sensor, view, date, {
		field: dustField,
	});

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

	const latestPoint = data?.at(-1) ?? null;
	const maxPoint = data && data.length > 0 ? getMaxPointByValue(data, (point) => point.value) : null;
	const maxValue = maxPoint?.value ?? 0;
	const averageValue =
		data && data.length > 0 ? data.reduce((sum, point) => sum + point.value, 0) / data.length : null;

	const minY = 0;
	const baseMaxY = 45;
	const maxY = maxValue > baseMaxY ? computeYAxisRange(data ?? []).maxY : baseMaxY;

	const calendarData = mapSensorDataToTimeBucketStatuses(data ?? [], sensor, false);
	const { minHour, maxHour } = getHourDomain(hourDomain, data?.map((d) => d.time) ?? [], view);

	const minTime = setHours(date, minHour);
	const maxTime = setHours(date, maxHour);

	const showTrendLineChart = view === "month" || view === "week";
	const showDustStatistics = view === "day";

	return (
		<div className="flex flex-col gap-16">
			<div className="flex flex-1 flex-col gap-4">
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
					<SensorGraphEmptyState date={date} locale={locale} />
				) : view === "month" ? (
					<CalendarWidget selectedDay={date} data={calendarData} />
				) : view === "week" ? (
					<WeekWidget dayStartHour={minHour} dayEndHour={maxHour} data={calendarData} />
				) : !data || data.length === 0 ? (
					<SensorGraphEmptyState date={date} locale={locale} />
				) : (
					<div className="w-full">
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
													`${date.toLocaleDateString(locale, {
														day: "numeric",
														month: "long",
														year: "numeric",
													})}-${user.name}-Dust-Exposure-Overview`,
													`${t(($) => $.pdf.dustExposure)} - ${user.name} - ${date.toLocaleDateString(locale)}`,
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
					</div>
				)}
			</div>
			{showTrendLineChart && <DustTrendLineChartCard unit={dustUnit} />}
		</div>
	);
}
