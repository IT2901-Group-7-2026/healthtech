import { ExposureRiskCard } from "@/components/exposure-level-card";
import { Card, CardContent, CardHeader } from "@/components/ui/card.js";
import { Skeleton } from "@/components/ui/skeleton.js";
import { AtRiskPopup } from "@/features/attention-card/exposure-level-popup.js";
import { StatCard } from "@/features/attention-card/stat-card";
import { TIMEZONE } from "@/i18n/locale";
import { type DangerLevel, mapDangerLevelToColor } from "@/lib/danger-levels.js";
import { now, parseAsTZDate, today } from "@/lib/date";
import type { ThresholdSummary, UserWithStatusDto } from "@/lib/dto.js";
import { parseAsSensor } from "@/lib/sensors.js";
import { cn } from "@/lib/utils";
import { isSameDay } from "date-fns";
import { parseAsString, useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

interface AttentionCardProps {
	subordinates: Array<UserWithStatusDto>;
	isSubordinatesLoading?: boolean;
	thresholdSummary?: ThresholdSummary;
	isThresholdSummaryLoading?: boolean;
	isWeekly?: boolean;
}

export const AttentionCard = ({
	subordinates,
	isSubordinatesLoading,
	thresholdSummary,
	isThresholdSummaryLoading,
	isWeekly,
}: AttentionCardProps) => {
	const { t } = useTranslation();
	const [sensor] = useQueryState("sensor", parseAsSensor);
	const [date] = useQueryState("filterDate", parseAsTZDate.withDefault(today()));
	const [, setSelectedUserId] = useQueryState("userId", parseAsString);

	const [selectedStatus, setSelectedStatus] = useState<DangerLevel | null>(null);
	const [popupStatus, setPopupStatus] = useState<DangerLevel | null>(null);

	const openForStatus = (status: DangerLevel) => {
		setPopupStatus(status);
		setSelectedStatus(status);
	};

	const closePopup = () => {
		setSelectedStatus(null);
	};

	const highestDangerLevel = useMemo(() => {
		const sensorType = sensor ?? "total";
		if (thresholdSummary === undefined) {
			return null;
		}

		if (subordinates === undefined || subordinates.length === 0) {
			return "safe";
		}

		if (thresholdSummary[sensorType].danger > 0) {
			return "danger";
		}

		if (thresholdSummary[sensorType].warning > 0) {
			return "warning";
		}

		return "safe";
	}, [thresholdSummary, subordinates, sensor]);

	const selectedSensorKey = sensor ?? "total";
	const showActionCard = !isWeekly && date ? isSameDay(date, now(), { in: TIMEZONE }) : false;

	const dangerLevelColor = highestDangerLevel === null ? null : `text-${mapDangerLevelToColor(highestDangerLevel)}`;

	// Daily granularity text
	const attentionHeaderText =
		highestDangerLevel === null ? null : t(($) => $.foremanDashboard.actionCard[highestDangerLevel]);

	const criticalExposureText =
		highestDangerLevel === "danger" ? t(($) => $.foremanDashboard.actionCard.criticalExposureText) : null;

	const approachingThresholdText =
		highestDangerLevel === "warning" ? t(($) => $.foremanDashboard.actionCard.approachingThresholdText) : null;

	// Weekly granularity text
	const weeklyHeaderText =
		highestDangerLevel === null ? null : t(($) => $.foremanDashboard.actionCard[highestDangerLevel]);

	const weekCriticalExposureText =
		highestDangerLevel === "danger" ? t(($) => $.foremanDashboard.actionCard.weekCriticalExposureText) : null;

	const weekApproachingThresholdText =
		highestDangerLevel === "warning" ? t(($) => $.foremanDashboard.actionCard.weekApproachingExposureText) : null;

	if (isThresholdSummaryLoading || thresholdSummary === undefined || highestDangerLevel === null) {
		return (
			<Card className="gap-3 p-6">
				<Skeleton className="h-8 w-[50%] rounded-full bg-zinc-100 dark:bg-accent" />
				<Skeleton className="mt-4 h-32 w-full rounded-xl bg-zinc-100 dark:bg-accent" />
			</Card>
		);
	}

	const actionCardHeader = (
		<CardHeader className="flex flex-row items-center justify-between">
			{isSubordinatesLoading ? (
				<Skeleton className="h-8 w-[50%] rounded-full bg-zinc-100 dark:bg-accent" />
			) : (
				<h2 className={cn("font-bold text-2xl", dangerLevelColor)}>
					{isWeekly ? weeklyHeaderText : attentionHeaderText}
				</h2>
			)}
		</CardHeader>
	);

	return (
		<>
			<Card muted={true} className="gap-3">
				{actionCardHeader}

				<CardContent className="gap-2">
					{isWeekly ? (
						<>
							{weekCriticalExposureText && <p>{weekCriticalExposureText}</p>}
							{weekApproachingThresholdText && <p>{weekApproachingThresholdText}</p>}
						</>
					) : showActionCard ? (
						<>
							{criticalExposureText && <p>{criticalExposureText}</p>}
							{approachingThresholdText && <p>{approachingThresholdText}</p>}
						</>
					) : (
						<p>{t(($) => $.foremanDashboard.actionCard.oldData)}</p>
					)}
					<div className="mt-5 grid items-stretch gap-6 md:grid-cols-2 lg:col-span-3 lg:grid-cols-3">
						{!sensor && (
							<>
								<StatCard
									className="text-red-500"
									label={t(($) => $.foremanDashboard.overview.statCards.danger.label)}
									onClick={() => openForStatus("danger")}
									value={thresholdSummary[selectedSensorKey].danger}
								/>

								<StatCard
									className="text-orange-400"
									label={t(($) => $.foremanDashboard.overview.statCards.warning.label)}
									onClick={() => openForStatus("warning")}
									value={thresholdSummary[selectedSensorKey].warning}
								/>

								<StatCard
									className="text-green-600"
									label={t(($) => $.foremanDashboard.overview.statCards.safe.label)}
									onClick={() => openForStatus("safe")}
									value={thresholdSummary[selectedSensorKey].safe}
								/>
							</>
						)}

						{sensor && (
							<>
								<ExposureRiskCard
									users={subordinates ?? []}
									sensor={sensor}
									dangerLevel="danger"
									onUserClick={setSelectedUserId}
								/>
								<ExposureRiskCard
									users={subordinates ?? []}
									sensor={sensor}
									dangerLevel="warning"
									onUserClick={setSelectedUserId}
								/>
								<ExposureRiskCard
									users={subordinates ?? []}
									sensor={sensor}
									dangerLevel="safe"
									onUserClick={setSelectedUserId}
								/>
							</>
						)}
					</div>
				</CardContent>
			</Card>

			{(popupStatus === "warning" || popupStatus === "danger" || popupStatus === "safe") && (
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
