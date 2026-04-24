import { ExportButton } from "@/components/export-button";
import { ThresholdLine } from "@/components/exposure-line-chart/threshold-line";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDate } from "@/features/date-picker/use-date";
import {
	BaseExposureLineChartCard,
	ExposureLineChartCardSkeleton,
} from "@/features/exposure-line-chart-card/base-exposure-line-chart-card";
import { getMaxPointByValue } from "@/features/statistic-card-utils";
import { useUser } from "@/features/user/user-context";
import { useView } from "@/features/views/use-view";
import { useExportPDF } from "@/hooks/use-export-pdf";
import { sensorQueryOptions } from "@/lib/api";
import { buildSensorQuery } from "@/lib/sensor-query-utils";
import {
	type DustField,
	defaultDustField,
	parseAsDustField,
	parseAsSensorUnit,
	type Sensor,
	type SensorUnit,
} from "@/lib/sensors";
import { getThreshold } from "@/lib/thresholds";
import { computeYAxisRange, DUST_Y_AXIS_STEP, downsampleSensorData, getHourDomain } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { setHours } from "date-fns";
import { useQueryState } from "nuqs";
import { useId } from "react";
import { useTranslation } from "react-i18next";
import { SensorGraphEmptyState } from "../statistic-card";

interface Props {
	userId?: string;
}

export function DustExposureLineChartCard({ userId }: Props) {
	const { view } = useView();
	const { date } = useDate();
	const { t, i18n } = useTranslation();
	const locale = i18n.language;
	const { user } = useUser();
	const { exportToPDF } = useExportPDF();
	const chartContainerId = useId();

	const [dustField] = useQueryState<DustField>("dustField", parseAsDustField.withDefault(defaultDustField));
	const [dustUnit, setDustUnit] = useQueryState("unit", parseAsSensorUnit.withDefault("ug"));

	const sensor: Sensor = "dust";

	const query = buildSensorQuery(sensor, view, date, {
		field: dustField,
	});

	const dustThreshold = getThreshold(sensor, query.field);

	const { data: response, isLoading } = useQuery(
		sensorQueryOptions({
			sensor,
			query,
			userId: userId ?? user.id,
		}),
	);

	const data = response?.data;
	const hourDomain = response?.hourDomain;

	const maxPoint = data && data.length > 0 ? getMaxPointByValue(data, (point) => point.value) : null;
	const maxValue = maxPoint?.value ?? 0;

	const minY = 0;
	const baseMaxY = 45;
	const maxY =
		maxValue > baseMaxY
			? computeYAxisRange(data ?? [], {
					step: DUST_Y_AXIS_STEP,
					topPadding: DUST_Y_AXIS_STEP,
				}).maxY
			: baseMaxY;

	const { minHour, maxHour } = getHourDomain(hourDomain, data?.map((d) => d.time) ?? [], view);

	const minTime = setHours(date, minHour);
	const maxTime = setHours(date, maxHour);

	if (isLoading) {
		return <ExposureLineChartCardSkeleton />;
	}

	if (!data || data.length === 0) {
		return <SensorGraphEmptyState date={date} locale={i18n.language} />;
	}

	return (
		<BaseExposureLineChartCard
			minTime={minTime}
			maxTime={maxTime}
			chartData={downsampleSensorData(sensor, data ?? [])}
			unit={dustUnit}
			id={chartContainerId}
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
		</BaseExposureLineChartCard>
	);
}
