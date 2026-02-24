/** biome-ignore-all lint/suspicious/noAlert: we allow alerts for testing */

import { DailyNotes } from "@/components/daily-notes.js";
import { Card } from "@/components/ui/card";
import { useUser } from "@/features/user-context";
import { useSubordinatesQuery } from "@/lib/api";
import type { DangerLevel } from "@/lib/danger-levels";
import { createLocationName } from "@/lib/dto.js";
import { parseAsSensor, type Sensor, sensors } from "@/lib/sensors";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/ui/select";
import { MapPinIcon, UsersIcon } from "lucide-react";
import { useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AtRiskPopup } from "./exposure-level-popup";
import { StatCard } from "./stat-card";

// biome-ignore lint/style/noDefaultExport: react router needs default export
export default function ForemanOverview() {
	const { t } = useTranslation();
	const [sensor, setSensor] = useQueryState("vibration", parseAsSensor);

	const { user } = useUser();

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
			<div className="mb-4 flex items-center justify-between">
				<h1 className="p-2 text-3xl">
					{t(($) => $.foremanDashboard.overview.title)}
				</h1>
				<Select
					onValueChange={(value) => {
						if (value === "__none") {
							setSensor(null);
						} else {
							setSensor(value as Sensor);
						}
					}}
					value={sensor ?? undefined}
				>
					<SelectTrigger className="w-32 bg-background dark:bg-background">
						<SelectValue
							placeholder={t(($) => $.sensorSelectPlaceholder)}
						/>
					</SelectTrigger>
					<SelectContent className="w-32">
						{sensors?.map((s) => (
							<SelectItem key={s} value={s}>
								{t(($) => $[s])}
							</SelectItem>
						))}
						<SelectItem value="__none">{"None"}</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="flex w-full flex-row gap-8">
				<div className="flex flex-col gap-4 md:w-1/4">
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

					<DailyNotes />
				</div>

				<div className="flex grow flex-col gap-4">
					<div className="grid gap-6 lg:grid-cols-3">
						<div className="grid items-stretch gap-4 md:grid-cols-2 lg:col-span-3 lg:grid-cols-3">
							<StatCard
								description={t(
									($) =>
										$.foremanDashboard.overview.statCards
											.inDanger.description,
								)}
								label={t(
									($) =>
										$.foremanDashboard.overview.statCards
											.inDanger.label,
								)}
								onClick={() => openForStatus("danger")}
								to="/"
								totalValue={total}
								value={countPerDangerLevel.danger}
								totalText={cardTotalText}
								viewDetailsText={cardViewDetailsText}
							/>
							<StatCard
								description={t(
									($) =>
										$.foremanDashboard.overview.statCards
											.atRisk.description,
								)}
								label={t(
									($) =>
										$.foremanDashboard.overview.statCards
											.atRisk.label,
								)}
								onClick={() => openForStatus("warning")}
								to="/"
								totalValue={total}
								value={countPerDangerLevel.warning}
								totalText={cardTotalText}
								viewDetailsText={cardViewDetailsText}
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
								onClick={() => openForStatus("safe")}
								to="/"
								totalValue={total}
								value={countPerDangerLevel.safe}
								totalText={cardTotalText}
								viewDetailsText={cardViewDetailsText}
							/>
						</div>
					</div>
				</div>

				<AtRiskPopup
					open={selectedStatus !== null}
					onClose={closePopup}
					title="Workers"
					status={popupStatus ?? "danger"}
				/>
			</div>
		</div>
	);
}
