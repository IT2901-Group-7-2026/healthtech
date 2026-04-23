import { Card, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { SensorUnit } from "@/lib/sensors";
import { formatSensorValue } from "@/lib/utils";
import { ArrowUpToLine } from "lucide-react";
import { useTranslation } from "react-i18next";

type SensorStatisticsSectionProps = {
	isLoading: boolean;
	isEmpty: boolean;
	averageValue: number | null;
	maxValue: number | null;
	maxTime: Date | null;
	latestValue: number | null;
	dangerThreshold: number | null;
	unit: SensorUnit;
	formatTime: (time: Date) => string;
};

export function SensorStatisticsSection({
	isLoading,
	isEmpty,
	averageValue,
	maxValue,
	maxTime,
	latestValue,
	dangerThreshold,
	unit,
	formatTime,
}: SensorStatisticsSectionProps) {
	const { t } = useTranslation();

	if (isLoading) {
		return <SensorStatisticsSkeleton />;
	}

	if (isEmpty) {
		return null;
	}

	const unitLabel = t(($) => $.sensors.units[unit]);
	const formatValue = (value: number | null) => formatSensorValue(value ?? undefined, unit, 2, { mg: 3 });
	const maxPointCaption = maxTime ? t(($) => $.measurement.recordedAt, { time: formatTime(maxTime) }) : undefined;

	return (
		<div className="grid gap-3 md:grid-cols-3">
			{averageValue !== null && (
				<StatisticCard
					label={t(($) => $.measurement.average)}
					value={formatValue(averageValue)}
					unitLabel={unitLabel}
					limitPercentage={getLimitPercentage(averageValue, dangerThreshold)}
				/>
			)}
			{maxValue !== null && (
				<StatisticCard
					label={t(($) => $.measurement.maximum)}
					value={formatValue(maxValue)}
					unitLabel={unitLabel}
					recordedAt={maxPointCaption}
					limitPercentage={getLimitPercentage(maxValue, dangerThreshold)}
				/>
			)}
			{latestValue !== null && (
				<StatisticCard
					label={t(($) => $.measurement.latest)}
					value={formatValue(latestValue)}
					unitLabel={unitLabel}
					limitPercentage={getLimitPercentage(latestValue, dangerThreshold)}
				/>
			)}
		</div>
	);
}

export function SensorGraphEmptyState({ date, locale }: { date: Date; locale: string }) {
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

function SensorStatisticsSkeleton() {
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
	value: string;
	unitLabel: string;
	recordedAt?: string;
	limitPercentage?: number | null;
};

function StatisticCard({ label, value, unitLabel, recordedAt, limitPercentage }: StatisticCardProps) {
	const { t } = useTranslation();

	return (
		<Card className="min-h-26.25 gap-1">
			<p className="text-muted-foreground text-xs uppercase tracking-widest">{label}</p>
			<p className="font-semibold text-2xl tabular-nums">
				{value} <span className="font-normal text-muted-foreground text-sm">{unitLabel}</span>
			</p>
			<div className="flex flex-wrap items-center gap-x-2 text-muted-foreground text-xs">
				<Tooltip>
					<TooltipTrigger asChild={true}>
						<span className="inline-flex items-center gap-1">
							<ArrowUpToLine className="size-3 shrink-0" />
							<span>
								{t(($) => $.measurement.limitValuePercentageShort, { percentage: limitPercentage })}
							</span>
						</span>
					</TooltipTrigger>
					<TooltipContent sideOffset={4}>
						<p>{t(($) => $.measurement.limitValuePercentageFull, { percentage: limitPercentage })}</p>
					</TooltipContent>
				</Tooltip>

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
