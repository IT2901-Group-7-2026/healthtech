import { ExposureRiskCard } from "@/components/exposure-level-card.tsx";
import { Card, CardContent, CardHeader } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { AtRiskPopup } from "@/features/attention-card/exposure-level-popup.tsx";
import { StatCard } from "@/features/attention-card/stat-card.tsx";
import {
	type DangerLevel,
	mapDangerLevelToColor,
} from "@/lib/danger-levels.ts";
import { type ThresholdSummary, type UserWithStatusDto } from "@/lib/dto.ts";
import { parseAsSensor } from "@/lib/sensors.ts";
import { cn } from "@/lib/utils.ts";
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
	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: TODO: we should refactor this
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
			? t(($) => $.foremanDashboard.actionCard.criticalExposureText)
			: null;

	const approachingThresholdText =
		highestDangerLevel === "warning"
			? t(($) => $.foremanDashboard.actionCard.approachingThresholdText)
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
					{showActionCard ? (
						<>
							{" "}
							<p>{criticalExposureText}</p>{" "}
							<p>{approachingThresholdText}</p>{" "}
						</>
					) : (
						<p>{t(($) => $.foremanDashboard.actionCard.oldData)}</p>
					)}{" "}
					<div className="mt-5 grid items-stretch gap-6 md:grid-cols-2 lg:col-span-3 lg:grid-cols-3">
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
