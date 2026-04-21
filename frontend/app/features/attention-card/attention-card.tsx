import { ExposureRiskCard } from "@/components/exposure-level-card";
import { Card, CardContent, CardHeader } from "@/components/ui/card.js";
import { Skeleton } from "@/components/ui/skeleton.js";
import { AtRiskPopup } from "@/features/attention-card/exposure-level-popup.js";
import { StatCard } from "@/features/attention-card/stat-card";
import { TIMEZONE } from "@/i18n/locale";
import { type DangerLevel, mapDangerLevelToColor } from "@/lib/danger-levels.js";
import { now } from "@/lib/date";
import type { ThresholdSummary, UserWithStatusDto } from "@/lib/dto.js";
import { parseAsSensor } from "@/lib/sensors.js";
import { cn } from "@/lib/utils";
import { isSameDay } from "date-fns";
import { parseAsString, useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDate } from "../date-picker/use-date.js";

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
	const { date } = useDate();
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
	const viewKey = isWeekly ? "weekView" : "dayView";

	const attentionHeaderText =
		highestDangerLevel === null ? null : t(($) => $.foremanDashboard.actionCard[highestDangerLevel]);

	const detailText =
		highestDangerLevel === "danger" || highestDangerLevel === "warning"
			? t(($) => $.foremanDashboard.actionCard[viewKey][highestDangerLevel])
			: null;

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
				<h2 className={cn("font-bold text-2xl", dangerLevelColor)}>{attentionHeaderText}</h2>
			)}
		</CardHeader>
	);

	return (
		<>
			<div className="flex flex-col gap-3 text-muted-foreground">
				{actionCardHeader}

				<CardContent className="gap-2">
					{showActionCard || isWeekly ? (
						detailText && <p>{detailText}</p>
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
			</div>

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
