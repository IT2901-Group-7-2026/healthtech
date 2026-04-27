import { ExportButton } from "@/components/export-button";
import { ThresholdLine } from "@/components/exposure-line-chart/threshold-line";
import { useDate } from "@/features/date-picker/use-date";
import {
	BaseExposureLineChartCard,
	ExposureLineChartCardSkeleton,
} from "@/features/exposure-line-chart-card/base-exposure-line-chart-card";
import { useUser } from "@/features/user/user-context";
import { parseAsView } from "@/features/views/utils";
import { useExportPDF } from "@/hooks/use-export-pdf";
import { exposureQueryOptions } from "@/lib/api";
import { buildExposureQuery } from "@/lib/exposure-query-utils";
import type { Exposure } from "@/lib/exposures";
import { getThreshold } from "@/lib/thresholds";
import { computeYAxisRange, downsampleExposureData, getHourDomain } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { setHours } from "date-fns";
import { useQueryState } from "nuqs";
import { useId } from "react";
import { useTranslation } from "react-i18next";
import { ExposureGraphEmptyState } from "../statistic-card";

interface Props {
	userId?: string;
}

export default function VibrationExposureLineChartCard({ userId }: Props) {
	const [view] = useQueryState("view", parseAsView.withDefault("day"));
	const { t, i18n } = useTranslation();

	const { date } = useDate();
	const { user } = useUser();
	const { exportToPDF } = useExportPDF();
	const chartContainerId = useId();

	const exposure: Exposure = "vibration";
	const vibrationThreshold = getThreshold(exposure);

	const query = buildExposureQuery(exposure, view, date);

	const { data: response, isLoading } = useQuery(
		exposureQueryOptions({
			exposure,
			query,
			userId: userId ?? user.id,
		}),
	);

	const data = response?.data;
	const hourDomain = response?.hourDomain;

	const { minHour, maxHour } = getHourDomain(
		hourDomain,
		data?.map((d) => d.time),
		view,
	);

	const maxValue = data ? Math.max(...data.map((d) => d.value)) : 0;

	const minY = 0;
	let maxY = 450;
	if (maxValue > maxY) {
		maxY = computeYAxisRange(data ?? []).maxY;
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
			unit="points"
			maxY={maxY}
			minY={minY}
			lineType="monotone"
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
							})}-${user.name}-Vibration-Exposure-Overview`,
							`${t(($) => $.pdf.vibrationExposure)} - ${user.name} - ${date.toLocaleDateString(i18n.language)}`,
						)
					}
				/>
			}
		>
			<ThresholdLine y={vibrationThreshold.danger} dangerLevel="danger" />
			<ThresholdLine y={vibrationThreshold.warning} dangerLevel="warning" />
		</BaseExposureLineChartCard>
	);
}
