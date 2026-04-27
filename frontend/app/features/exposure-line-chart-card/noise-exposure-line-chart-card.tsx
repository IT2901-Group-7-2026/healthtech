import { ExportButton } from "@/components/export-button";
import { ThresholdLine } from "@/components/exposure-line-chart/threshold-line";
import { useDate } from "@/features/date-picker/use-date";
import {
	BaseExposureLineChartCard,
	ExposureLineChartCardSkeleton,
} from "@/features/exposure-line-chart-card/base-exposure-line-chart-card";
import { getMaxPointByValue } from "@/features/statistic-card-utils";
import { useUser } from "@/features/user/user-context";
import { useView } from "@/features/views/use-view";
import { useExportPDF } from "@/hooks/use-export-pdf";
import { exposureQueryOptions } from "@/lib/api";
import { type Aggregation, Aggregations, type ExposureDto } from "@/lib/dto";
import { buildExposureQuery } from "@/lib/exposure-query-utils";
import type { Exposure } from "@/lib/exposures";
import { getThreshold } from "@/lib/thresholds";
import { computeYAxisRange, downsampleExposureData, getHourDomain } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { setHours } from "date-fns";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useId } from "react";
import { useTranslation } from "react-i18next";
import { ExposureGraphEmptyState } from "../statistic-card";

interface Props {
	userId?: string;
}

export default function NoiseExposureLineChartCard({ userId }: Props) {
	const { view } = useView();
	const { t, i18n } = useTranslation();

	const { date } = useDate();
	const { user } = useUser();
	const { exportToPDF } = useExportPDF();
	const chartContainerId = useId();

	const exposure: Exposure = "noise";
	const parseAsAggregation = parseAsStringLiteral(Aggregations);
	const [aggregation] = useQueryState<Aggregation>("aggregation", parseAsAggregation.withDefault("average"));
	const usePeakAggregation = aggregation === "peak";
	const noiseThreshold = getThreshold(exposure);

	const query = buildExposureQuery(exposure, view, date, {
		usePeakAggregation,
	});

	const { data: response, isLoading } = useQuery(
		exposureQueryOptions({
			exposure,
			query,
			userId: userId ?? user.id,
		}),
	);

	const data = response?.data;
	const hourDomain = response?.hourDomain;
	const maxPoint =
		data && data.length > 0
			? getMaxPointByValue(data, (point) => getDisplayedNoiseValue(point, usePeakAggregation))
			: null;

	const { minHour, maxHour } = getHourDomain(
		hourDomain,
		data?.map((d) => d.time),
		view,
	);

	const maxValue = maxPoint ? getDisplayedNoiseValue(maxPoint, usePeakAggregation) : 0;

	const minY = 0;
	let maxY = 150;
	if (maxValue > maxY) {
		maxY = computeYAxisRange(data ?? [], {
			step: usePeakAggregation ? 130 : undefined,
		}).maxY;
	}

	const minTime = setHours(date, minHour);
	const maxTime = setHours(date, maxHour);

	if (isLoading) {
		return <ExposureLineChartCardSkeleton />;
	}

	if (!data || data.length === 0) {
		return <ExposureGraphEmptyState date={date} locale={i18n.language} />;
	}

	return (
		<BaseExposureLineChartCard
			minTime={minTime}
			maxTime={maxTime}
			chartData={downsampleExposureData(exposure, data ?? [])}
			unit="dbTwa"
			maxY={maxY}
			minY={minY}
			exposure={exposure}
			id={chartContainerId}
			headerRight={
				<ExportButton
					title={t(($) => $.common.exportAsPdf)}
					onClick={() =>
						exportToPDF(
							chartContainerId,
							`${date.toLocaleDateString(i18n.language, {
								day: "numeric",
								month: "long",
								year: "numeric",
							})}-${user.name}-Noise-Exposure-Overview`,
							`${t(($) => $.pdf.noiseExposure)} - ${user.name} - ${date.toLocaleDateString(i18n.language)}`,
						)
					}
				/>
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
		</BaseExposureLineChartCard>
	);
}

function getDisplayedNoiseValue(point: ExposureDto, usePeakAggregation: boolean) {
	return usePeakAggregation && point.peakValue != null ? point.peakValue : point.value;
}
