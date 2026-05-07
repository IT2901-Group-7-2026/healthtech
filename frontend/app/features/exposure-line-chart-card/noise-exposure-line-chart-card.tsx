import { ExportButton } from "@/components/export-button.tsx";
import { ThresholdLine } from "@/components/exposure-line-chart/threshold-line.tsx";
import { useDate } from "@/features/date-picker/use-date.ts";
import {
	BaseExposureLineChartCard,
	ExposureLineChartCardSkeleton,
} from "@/features/exposure-line-chart-card/base-exposure-line-chart-card.tsx";
import { getMaxPointByValue } from "@/features/statistic-card-utils.ts";
import { useUser } from "@/features/user/user-context.tsx";
import { useView } from "@/features/views/use-view.ts";
import { useExportPDF } from "@/hooks/use-export-pdf.ts";
import { exposureQueryOptions } from "@/lib/api.ts";
import { type Aggregation, Aggregations, type ExposureDto } from "@/lib/dto/exposure.ts";
import { buildExposureQuery } from "@/lib/exposure-query-utils.ts";
import type { Exposure } from "@/lib/exposures.ts";
import { getThreshold } from "@/lib/thresholds.ts";
import { computeYAxisRange, downsampleExposureData, getHourDomain } from "@/lib/utils.ts";
import { useQuery } from "@tanstack/react-query";
import { setHours } from "date-fns";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useId } from "react";
import { useTranslation } from "react-i18next";
import { ExposureGraphEmptyState } from "../statistic-card.tsx";

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
			unit="db"
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
