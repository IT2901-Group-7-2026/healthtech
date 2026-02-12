/** biome-ignore-all lint/suspicious/noAlert: we allow alerts for testing */

import { Card } from "@/components/ui/card";
import { useUser } from "@/features/user/user-user";
import { useSubordinatesQuery } from "@/lib/api";
import { createLocationName } from "@/lib/dto";
import { MapPinIcon, UsersIcon } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { StatCard } from "./stat-card";

// biome-ignore lint: page components can be default exports
export default function ForemanHome() {
	const { t } = useTranslation();
	const navigate = useNavigate();

	const { user } = useUser();

	useEffect(() => {
		if (user.role !== "foreman") {
			navigate("/");
			return;
		}
	}, [user, navigate]);

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

	return (
		<div>
			<h1 className="p-2 text-3xl">
				{t(($) => $.foremanDashboard.overview.title)}
			</h1>

			<div className="grid w-full gap-6 lg:grid-cols-4">
				<div className="grid items-stretch gap-4 md:grid-cols-2 lg:col-span-3 lg:grid-cols-3">
					<StatCard
						description={t(
							($) => $.foremanDashboard.overview.statCards.inDanger.description,
						)}
						label={t(
							($) => $.foremanDashboard.overview.statCards.inDanger.label,
						)}
						to="/"
						totalValue={total}
						value={countPerDangerLevel.danger}
						totalText={cardTotalText}
						viewDetailsText={cardViewDetailsText}
					/>
					<StatCard
						description={t(
							($) => $.foremanDashboard.overview.statCards.atRisk.description,
						)}
						label={t(($) => $.foremanDashboard.overview.statCards.atRisk.label)}
						to="/"
						totalValue={total}
						value={countPerDangerLevel.warning}
						totalText={cardTotalText}
						viewDetailsText={cardViewDetailsText}
					/>
					<StatCard
						description={t(
							($) =>
								$.foremanDashboard.overview.statCards.withinLimits.description,
						)}
						label={t(
							($) => $.foremanDashboard.overview.statCards.withinLimits.label,
						)}
						to="/"
						totalValue={total}
						value={countPerDangerLevel.safe}
						totalText={cardTotalText}
						viewDetailsText={cardViewDetailsText}
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
			</div>
		</div>
	);
}
