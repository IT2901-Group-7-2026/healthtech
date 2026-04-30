import { Card, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { dangerlevelStyles, getDangerLevel } from "@/lib/danger-levels.js";
import type { ExposureUnit } from "@/lib/exposures";
import { formatExposureValue } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const formatValue = (value: number | null, unit: ExposureUnit) =>
	formatExposureValue(value ?? undefined, unit, 2, { mg: 3 });

type ExposureStatisticsSectionProps = {
	isLoading: boolean;
	isEmpty: boolean;
	averageValue: number | null;
	maxValue: number | null;
	maxTime: Date | null;
	latestValue: number | null;
	warningThreshold: number | null;
	dangerThreshold: number | null;
	unit: ExposureUnit;
	formatTime: (time: Date) => string;
};

export function ExposureStatisticsSection({
	isLoading,
	isEmpty,
	averageValue,
	maxValue,
	maxTime,
	latestValue,
	warningThreshold,
	dangerThreshold,
	unit,
	formatTime,
}: ExposureStatisticsSectionProps) {
	const { t } = useTranslation();

	if (isLoading) {
		return <ExposureStatisticsSkeleton />;
	}

	if (isEmpty) {
		return null;
	}

	const maxPointCaption = maxTime ? t(($) => $.measurement.recordedAt, { time: formatTime(maxTime) }) : undefined;

	return (
		<div className="grid gap-3 md:grid-cols-3">
			{averageValue !== null && (
				<StatisticCard
					label={t(($) => $.measurement.average)}
					value={averageValue}
					unit={unit}
					warningThreshold={warningThreshold}
					dangerThreshold={dangerThreshold}
				/>
			)}
			{maxValue !== null && (
				<StatisticCard
					label={t(($) => $.measurement.maximum)}
					value={maxValue}
					unit={unit}
					recordedAt={maxPointCaption}
					warningThreshold={warningThreshold}
					dangerThreshold={dangerThreshold}
				/>
			)}
			{latestValue !== null && (
				<StatisticCard
					label={t(($) => $.measurement.latest)}
					value={latestValue}
					unit={unit}
					warningThreshold={warningThreshold}
					dangerThreshold={dangerThreshold}
				/>
			)}
		</div>
	);
}

export function ExposureGraphEmptyState({ date, locale }: { date: Date; locale: string }) {
	const { t } = useTranslation();

	return (
		<Card className="flex min-h-80 w-full items-center justify-center gap-1 text-center">
			<CardTitle className="font-medium text-muted-foreground text-sm">
				{date.toLocaleDateString(locale, {
					day: "numeric",
					month: "long",
					year: "numeric",
				})}
			</CardTitle>
			<p className="text-muted-foreground text-xs">{t(($) => $.common.noData)}</p>
		</Card>
	);
}

function ExposureStatisticsSkeleton() {
	return (
		<div className="grid gap-3 md:grid-cols-3">
			{["average", "maximum", "latest"].map((key) => (
				<Card key={key} className="gap-2">
					<Skeleton className="h-3 w-20" />
					<Skeleton className="h-8 w-32" />
					<Skeleton className="h-3 w-24" />
				</Card>
			))}
		</div>
	);
}

type StatisticCardProps = {
	label: string;
	value: number;
	unit: ExposureUnit;
	warningThreshold: number | null;
	dangerThreshold: number | null;
	recordedAt?: string;
};

function StatisticCard({ label, value, unit, recordedAt, warningThreshold, dangerThreshold }: StatisticCardProps) {
	const { t } = useTranslation();

	const valueString = formatValue(value, unit);
	const actionLimitPercentage = getLimitPercentage(value, dangerThreshold);

	const dangerLevel =
		warningThreshold !== null && dangerThreshold !== null
			? getDangerLevel(value, warningThreshold, dangerThreshold)
			: null;

	const color = dangerLevel ? dangerlevelStyles[dangerLevel].color : "var(--foreground)";

	const unitLabel = t(($) => $.exposures.units[unit]);

	return (
		<Card className="min-h-26.25 gap-1">
			<p className="text-muted-foreground text-xs uppercase tracking-widest">{label}</p>

			<div className="flex flex-col gap-1 lg:flex-row lg:items-center lg:gap-2">
				<div className="size-4 rounded-md" style={{ backgroundColor: color }} />

				<p className="font-semibold text-2xl">
					{actionLimitPercentage}
					{" % "}
					<span className="font-normal text-muted-foreground text-sm">
						{t(($) => $.measurement.ofTheLimitValue)}
					</span>
				</p>
			</div>

			<div className="flex flex-wrap items-center gap-x-2 text-muted-foreground text-xs">
				<p className="tabular-nums">
					{valueString} {unitLabel}
				</p>

				{recordedAt !== undefined && (
					<>
						<span aria-hidden={true} className="size-1 rounded-full bg-muted-foreground" />

						<div className="flex items-center gap-1">
							<p>{recordedAt}</p>
						</div>
					</>
				)}
			</div>
		</Card>
	);
}

function getLimitPercentage(value: number | null, dangerThreshold: number | null) {
	if (value == null || dangerThreshold == null || dangerThreshold <= 0) {
		return null;
	}

	return Math.round((value / dangerThreshold) * 100);
}
