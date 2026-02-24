/** biome-ignore-all lint/suspicious/noAlert: we allow alerts for testing */

import { Card } from "@/components/ui/card";
import { useUser } from "@/features/user-provider.js";
import { useSubordinatesQuery } from "@/lib/api";
import { createLocationName } from "@/lib/dto";
import { MapPinIcon, UsersIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { StatCard } from "./stat-card";
import { AtRiskTable } from "./workers-at-risk-table";
import { usePopup } from "@/features/popups/use-popup";
import { AtRiskPopup } from "./exposure-level-popup";
import type { DangerLevel } from "@/lib/danger-levels";

// biome-ignore lint: page components can be default exports
export default function ForemanOverview() {
	const { t } = useTranslation();
	const navigate = useNavigate();

	const { user } = useUser();

	useEffect(() => {
		if (user.role !== "foreman") {
			navigate("/");
			return;
		}
	}, [user, navigate]);

	const [selectedStatus, setSelectedStatus] =
  useState<DangerLevel | null>(null);

	const [popupStatus, setPopupStatus] =
  useState<DangerLevel | null>(null);

  const openForStatus = (status: DangerLevel) => {
  setPopupStatus(status);     // lock content
  setSelectedStatus(status);  // open popup
};

const closePopup = () => {
  setSelectedStatus(null);    // triggers fade-out
};

	const { data: subordinates } = useSubordinatesQuery(user.id);

	const countPerDangerLevel = useMemo(() => {
		let danger = 0;
		let warning = 0;
		let safe = 0;

		for (const s of subordinates ?? []) {
			if (s.status.status === "danger") {
				danger++;
			} else if (s.status.status === "warning") {
				warning++;
			} else {
				safe++;
			}
		}

		return { danger, warning, safe };
	}, [subordinates]);

	const total = subordinates?.length ?? 0;

	const cardTotalText = t(($) => $.foremanDashboard.overview.statCards.total);
	const cardViewDetailsText = t(
		($) => $.foremanDashboard.overview.statCards.viewDetails,
	);
	//TODO: Update card links to point to stats page

	return (
		<div>
			<h1 className="p-2 text-3xl">
				{t(($) => $.foremanDashboard.overview.title)}
			</h1>

			<div className="grid w-full gap-6 lg:grid-cols-4">
				<div className="grid items-stretch gap-4 md:grid-cols-2 lg:col-span-3 lg:grid-cols-3">
					<StatCard
						description={t(
							($) => $.foremanDashboard.overview.statCards.inDanger
								.description
						)}
						label={t(
							($) => $.foremanDashboard.overview.statCards.inDanger
								.label
						)}
						totalValue={total}
						value={countPerDangerLevel.danger}
						totalText={cardTotalText}
						viewDetailsText={cardViewDetailsText}
						onClick={() => openForStatus("danger")}
						to="/"
					/>
					<StatCard
						description={t(
							($) =>
								$.foremanDashboard.overview.statCards.atRisk
									.description,
						)}
						label={t(
							($) =>
								$.foremanDashboard.overview.statCards.atRisk
									.label,
						)}
						totalValue={total}
						value={countPerDangerLevel.warning}
						totalText={cardTotalText}
						viewDetailsText={cardViewDetailsText}
						onClick={() => openForStatus("warning")}
						to="/"
					/>
					<StatCard
						description={t(
							($) =>
								$.foremanDashboard.overview.statCards
									.withinLimits.description,
						)}
						label={t(
							($) =>
								$.foremanDashboard.overview.statCards
									.withinLimits.label,
						)}
						
						totalValue={total}
						value={countPerDangerLevel.safe}
						totalText={cardTotalText}
						viewDetailsText={cardViewDetailsText}
						onClick={() => openForStatus("safe")}
						to="/"
					/>
				</div>

				<Card className="flex h-fit flex-col gap-4 p-4">
					<div className="flex items-center gap-2">
						<MapPinIcon />
						{createLocationName(user.location)}
					</div>

					<div className="flex items-center gap-2">
						<UsersIcon />
						{t(($) => $.foremanDashboard.teamMembersCount, {
							count: total,
						})}
					</div>
				</Card>
				<AtRiskTable />
				<AtRiskPopup
					open={selectedStatus !== null}
					onClose={closePopup}
					title="Workers"
					status={popupStatus!}
				/>
			</div>
		</div>
	);
}
