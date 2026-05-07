import { ExposureRiskCard } from "@/components/exposure-level-card";
import { Card, CardContent, CardHeader } from "@/components/ui/card.js";
import { Skeleton } from "@/components/ui/skeleton.js";
import { AtRiskPopup } from "@/features/attention-card/exposure-level-popup.js";
import { StatCard } from "@/features/attention-card/stat-card";
import type { DangerLevel } from "@/lib/danger-levels.js";
import type { ThresholdSummary } from "@/lib/dto/threshold";
import type { UserWithStatusDto } from "@/lib/dto/user";
import { parseAsExposure } from "@/lib/exposures.js";
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
	const [exposure] = useQueryState("exposure", parseAsExposure);
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
		const exposureType = exposure ?? "total";
		if (thresholdSummary === undefined) {
			return null;
		}

		if (subordinates === undefined || subordinates.length === 0) {
			return "safe";
		}

		if (thresholdSummary[exposureType].danger > 0) {
			return "danger";
		}

		if (thresholdSummary[exposureType].warning > 0) {
			return "warning";
		}

		return "safe";
	}, [thresholdSummary, subordinates, exposure]);

	const selectedExposureKey = exposure ?? "total";

	const attentionHeaderText =
		highestDangerLevel === null ? null : t(($) => $.foremanDashboard.actionCard[highestDangerLevel]);

	const warningDescription =
		highestDangerLevel === "danger" || highestDangerLevel === "warning"
			? t(($) => $.foremanDashboard.actionCard[`${highestDangerLevel}Description`])
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
		<CardHeader className="flex flex-col gap-2">
			{isSubordinatesLoading ? (
				<Skeleton className="h-8 w-[50%] rounded-full bg-zinc-100 dark:bg-accent" />
			) : (
				<>
					<h2 className="font-bold text-2xl text-foreground">{attentionHeaderText}</h2>
					{warningDescription && <p className="text-muted-foreground">{warningDescription}</p>}
				</>
			)}
		</CardHeader>
	);

	return (
		<>
			<div className="flex flex-col gap-3 text-muted-foreground">
				{actionCardHeader}

				<CardContent className="gap-2">
					<div className="mt-5 grid items-stretch gap-6 md:grid-cols-2 lg:col-span-3 lg:grid-cols-3">
						{!exposure && (
							<>
								<StatCard
									label={t(($) => $.foremanDashboard.overview.statCards.danger.label)}
									dangerLevel="danger"
									onClick={() => openForStatus("danger")}
									value={thresholdSummary[selectedExposureKey].danger}
								/>

								<StatCard
									label={t(($) => $.foremanDashboard.overview.statCards.warning.label)}
									dangerLevel="warning"
									onClick={() => openForStatus("warning")}
									value={thresholdSummary[selectedExposureKey].warning}
								/>

								<StatCard
									label={t(($) => $.foremanDashboard.overview.statCards.safe.label)}
									dangerLevel="safe"
									onClick={() => openForStatus("safe")}
									value={thresholdSummary[selectedExposureKey].safe}
								/>
							</>
						)}

						{exposure && (
							<>
								<ExposureRiskCard
									users={subordinates ?? []}
									exposure={exposure}
									dangerLevel="danger"
									onUserClick={setSelectedUserId}
								/>
								<ExposureRiskCard
									users={subordinates ?? []}
									exposure={exposure}
									dangerLevel="warning"
									onUserClick={setSelectedUserId}
								/>
								<ExposureRiskCard
									users={subordinates ?? []}
									exposure={exposure}
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
