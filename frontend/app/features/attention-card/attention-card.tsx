import { ExposureRiskCard } from "@/components/exposure-level-card";
import { Card, CardContent, CardHeader } from "@/components/ui/card.js";
import { Skeleton } from "@/components/ui/skeleton.js";
import { AtRiskPopup } from "@/features/attention-card/exposure-level-popup.js";
import { StatCard } from "@/features/attention-card/stat-card";
import {
	type DangerLevel,
	mapDangerLevelToColor,
} from "@/lib/danger-levels.js";
import type { ThresholdSummary, UserWithStatusDto } from "@/lib/dto.js";
import { parseAsSensor } from "@/lib/sensors.js";
import { cn } from "@/lib/utils";
import { formatDate, isToday } from "date-fns";
import { parseAsString, useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

interface AttentionCardProps {
	subordinates: Array<UserWithStatusDto>;
	isSubordinatesLoading?: boolean;
	thresholdSummary?: ThresholdSummary;
	isThresholdSummaryLoading?: boolean;
}

export const AttentionCard = ({
	subordinates,
	isSubordinatesLoading,
	thresholdSummary,
	isThresholdSummaryLoading,
}: AttentionCardProps) => {
	const { t } = useTranslation();
	const [sensor] = useQueryState("sensor", parseAsSensor);
	const [date] = useQueryState(
		"filterDate",
		parseAsString.withDefault(formatDate(new Date(), "yyyy-MM-dd")),
	);

	const [selectedStatus, setSelectedStatus] = useState<DangerLevel | null>(
		null,
	);
	const [popupStatus, setPopupStatus] = useState<DangerLevel | null>(null);

	const openForStatus = (status: DangerLevel) => {
		setPopupStatus(status);
		setSelectedStatus(status);
	};

	const closePopup = () => {
		setSelectedStatus(null);
	};

	const highestDangerLevel = useMemo(() => {
		if (thresholdSummary === undefined) {
			return null;
		}

		if (subordinates === undefined || subordinates.length === 0) {
			return "safe";
		}

		if (thresholdSummary.total.danger > 0) {
			return "danger";
		}

		if (thresholdSummary.total.warning > 0) {
			return "warning";
		}

		return "safe";
	}, [thresholdSummary, subordinates]);

	const selectedSensorKey = sensor ?? "total";
	const showActionCard = date ? isToday(date) : false;

	const operatorsInDanger = subordinates.filter(
		(subordinate) => subordinate.status.status === "danger",
	).length;

	const operatorsNearThresholds = subordinates.filter(
		(subordinate) => subordinate.status.status === "warning",
	).length;

	const dangerLevelColor =
		highestDangerLevel !== null
			? `text-${mapDangerLevelToColor(highestDangerLevel)}`
			: null;

	const attentionHeaderText =
		highestDangerLevel !== null
			? t(($) => $.foremanDashboard.actionCard[highestDangerLevel])
			: null;

	const criticalExposureText =
		highestDangerLevel === "danger"
			? t(($) => $.foremanDashboard.actionCard.criticalExposureText, {
					count: operatorsInDanger,
				})
			: null;

	const approachingThresholdText =
		highestDangerLevel === "warning" || highestDangerLevel === "danger"
			? t(($) => $.foremanDashboard.actionCard.approachingThresholdText, {
					count: operatorsNearThresholds,
				})
			: null;

	if (
		isThresholdSummaryLoading ||
		thresholdSummary === undefined ||
		highestDangerLevel === null
	) {
		return (
			<Card className="gap-3 p-6">
				<Skeleton className="h-8 w-[50%] rounded-full bg-zinc-100 dark:bg-accent" />
				<Skeleton className="mt-4 h-32 w-full rounded-xl bg-zinc-100 dark:bg-accent" />
			</Card>
		);
	}

	const actionCardHeader = showActionCard && (
		<CardHeader>
			{isSubordinatesLoading ? (
				<Skeleton className="h-8 w-[50%] rounded-full bg-zinc-100 dark:bg-accent" />
			) : (
				<h2 className={cn("font-bold text-2xl", dangerLevelColor)}>
					{attentionHeaderText}
				</h2>
			)}
		</CardHeader>
	);

	return (
		<>
			<Card muted className="gap-3">
				{actionCardHeader}

				<CardContent className="gap-2">
					<p>{criticalExposureText}</p>
					<p className="mb-5">{approachingThresholdText}</p>

					<div className="grid items-stretch gap-6 md:grid-cols-2 lg:col-span-3 lg:grid-cols-3">
						{!sensor && (
							<>
								<StatCard
									className="text-red-500"
									label={t(
										($) =>
											$.foremanDashboard.overview
												.statCards.danger.label,
									)}
									onClick={() => openForStatus("danger")}
									value={
										thresholdSummary[selectedSensorKey]
											.danger
									}
								></StatCard>

								<StatCard
									className="text-orange-400"
									label={t(
										($) =>
											$.foremanDashboard.overview
												.statCards.warning.label,
									)}
									onClick={() => openForStatus("warning")}
									value={
										thresholdSummary[selectedSensorKey]
											.warning
									}
								></StatCard>

								<StatCard
									className="text-green-600"
									label={t(
										($) =>
											$.foremanDashboard.overview
												.statCards.safe.label,
									)}
									onClick={() => openForStatus("safe")}
									value={
										thresholdSummary[selectedSensorKey].safe
									}
								/>
							</>
						)}

						{sensor && (
							<>
								<ExposureRiskCard
									users={subordinates ?? []}
									sensor={sensor}
									dangerLevel="danger"
								/>
								<ExposureRiskCard
									users={subordinates ?? []}
									sensor={sensor}
									dangerLevel="warning"
								/>
								<ExposureRiskCard
									users={subordinates ?? []}
									sensor={sensor}
									dangerLevel="safe"
								/>
							</>
						)}
					</div>
				</CardContent>
			</Card>

			{(popupStatus === "warning" ||
				popupStatus === "danger" ||
				popupStatus === "safe") && (
				<AtRiskPopup
					open={selectedStatus !== null}
					onClose={closePopup}
					title="Workers"
					status={popupStatus}
					subordinates={subordinates ?? []}
				/>
			)}
		</>
	);
};
