import { ExposureRiskCard } from "@/components/exposure-level-card";
import { Card } from "@/components/ui/card.js";
import { Skeleton } from "@/components/ui/skeleton.js";
import { AtRiskPopup } from "@/features/attention-card/exposure-level-popup.js";
import { StatCard } from "@/features/attention-card/stat-card";
import {
	type DangerLevel,
	mapDangerLevelToColor,
} from "@/lib/danger-levels.js";
import type { ThresholdSummary, UserWithStatusDto } from "@/lib/dto.js";
import { parseAsSensor } from "@/lib/sensors.js";
import { formatDate, isToday } from "date-fns";
import { parseAsString, useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

interface AttentionCardProps {
	subordinates?: Array<UserWithStatusDto>;
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

	if (
		isThresholdSummaryLoading ||
		thresholdSummary === undefined ||
		highestDangerLevel === null
	) {
		// TODO: replace with skeleton loading
		return <Card>{"Loading..."}</Card>;
	}

	return (
		<>
			<Card>
				{showActionCard &&
					(isSubordinatesLoading ? (
						<Skeleton className="mx-auto h-8 w-[50%] rounded-md bg-zinc-100 dark:bg-accent" />
					) : (
						<p
							className={`text-center text-${mapDangerLevelToColor(highestDangerLevel)} caption-bottom font-bold text-2xl`}
						>
							{t(
								($) =>
									$.foremanDashboard.actionCard[
										highestDangerLevel
									],
							)}
						</p>
					))}

				<div className="grid gap-6 lg:grid-cols-3">
					<div className="grid items-stretch gap-4 md:grid-cols-2 lg:col-span-3 lg:grid-cols-3">
						{!sensor && (
							<>
								<StatCard
									description={t(
										($) =>
											$.foremanDashboard.overview
												.statCards.danger.description,
									)}
									label={t(
										($) =>
											$.foremanDashboard.overview
												.statCards.danger.label,
									)}
									onClick={() => openForStatus("danger")}
									to="/"
									value={
										thresholdSummary[selectedSensorKey]
											.danger
									}
								/>
								<StatCard
									description={t(
										($) =>
											$.foremanDashboard.overview
												.statCards.warning.description,
									)}
									label={t(
										($) =>
											$.foremanDashboard.overview
												.statCards.warning.label,
									)}
									onClick={() => openForStatus("warning")}
									to="/"
									value={
										thresholdSummary[selectedSensorKey]
											.warning
									}
								/>
								<StatCard
									description={t(
										($) =>
											$.foremanDashboard.overview
												.statCards.safe.description,
									)}
									label={t(
										($) =>
											$.foremanDashboard.overview
												.statCards.safe.label,
									)}
									to="/"
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
				</div>
			</Card>

			{(popupStatus === "warning" || popupStatus === "danger") && (
				<AtRiskPopup
					open={selectedStatus !== null}
					onClose={closePopup}
					title="Workers"
					status={popupStatus}
				/>
			)}
		</>
	);
};
