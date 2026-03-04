/** biome-ignore-all lint/suspicious/noAlert: we allow alerts for testing */

import { DailyNotes } from "@/components/daily-notes.js";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import {
	Combobox,
	ComboboxContent,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "@/components/ui/combobox";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserStatusChart } from "@/components/users-status-chart";
import { useUser } from "@/features/user/user-context";
import { fetchSubordinatesQueryOptions, usersQueryOptions } from "@/lib/api.js";
import type { DangerLevel } from "@/lib/danger-levels";
import { createLocationName, type UserWithStatusDto } from "@/lib/dto.js";
import { parseAsSensor, type Sensor, sensors } from "@/lib/sensors";
import { useQuery } from "@tanstack/react-query";
import { addWeeks, format, parseISO, startOfDay } from "date-fns";
import { ChevronDownIcon, MapPinIcon, UsersIcon } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActionCard } from "./action-card";
import { AtRiskPopup } from "./exposure-level-popup";
import { PieChartCard } from "./pie-chart-card";
import { StatCard } from "./stat-card";
import { AtRiskTable } from "./workers-at-risk-table";

export default function ForemanOverview() {
	const { t } = useTranslation();
	const [sensor, setSensor] = useQueryState("vibration", parseAsSensor);
	const [date, setDate] = useQueryState("filterDate", parseAsString);
	const [selectedUser, setSelectedUser] = useQueryState(
		"user",
		parseAsString,
	);

	const minSelectableDate = startOfDay(addWeeks(new Date(), -1));

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

	const { data: subordinates } = useQuery(
		fetchSubordinatesQueryOptions(user.id),
	);

	const { data: users } = useQuery(usersQueryOptions());

	const addSubordinateDangerLevel = useCallback(
		(
			result: Record<Sensor | "total", Record<DangerLevel, number>>,
			subordinate: UserWithStatusDto,
		) => {
			result.total[subordinate.status.status]++;

			for (const sensorType of sensors) {
				const level = subordinate.status[sensorType]?.level;

				// Missing sensor data is treated as safe
				result[sensorType][level ?? "safe"]++;
			}
		},
		[],
	);

	const countPerDangerLevel = useMemo(() => {
		const result: Record<
			Sensor | "total",
			{ danger: number; warning: number; safe: number }
		> = {
			dust: { danger: 0, warning: 0, safe: 0 },
			noise: { danger: 0, warning: 0, safe: 0 },
			vibration: { danger: 0, warning: 0, safe: 0 },
			total: { danger: 0, warning: 0, safe: 0 },
		};

		for (const subordinate of subordinates ?? []) {
			addSubordinateDangerLevel(result, subordinate);
		}

		return result;
	}, [subordinates, addSubordinateDangerLevel]);

	const total = subordinates?.length ?? 0;

	const cardTotalText = t(($) => $.foremanDashboard.overview.statCards.total);
	const cardViewDetailsText = t(
		($) => $.foremanDashboard.overview.statCards.viewDetails,
	);
	//TODO: Update card links to point to stats page

	const selectedDate = date ? parseISO(date) : undefined;

	return (
		<div>
			<Card className="mb-4 flex flex-row justify-between px-4 py-2">
				<Tabs
					className="w-[400px]"
					value={sensor ?? "all"}
					onValueChange={(value) => setSensor(value as Sensor | null)}
				>
					<TabsList>
						<TabsTrigger value="all" className="p-4">
							All
						</TabsTrigger>
						<TabsTrigger value="vibration" className="p-4">
							Vibration
						</TabsTrigger>
						<TabsTrigger value="noise" className="p-4">
							Noise
						</TabsTrigger>
						<TabsTrigger value="dust" className="p-4">
							Dust
						</TabsTrigger>
					</TabsList>
				</Tabs>
				<div className="flex flex-end flex-row gap-4">
					<Combobox
						items={users?.map((u) => u.username) ?? []}
						value={selectedUser ?? undefined}
						onValueChange={(value) => setSelectedUser(value)}
					>
						<ComboboxInput placeholder="Select a user" showClear />
						<ComboboxContent>
							<ComboboxList>
								{(item) => (
									<ComboboxItem key={item} value={item}>
										{item}
									</ComboboxItem>
								)}
							</ComboboxList>
						</ComboboxContent>
					</Combobox>
					<Popover>
						<PopoverTrigger asChild>
							<Button
								variant={"outline"}
								data-empty={!date}
								className="w-[212px] justify-between text-left font-normal data-[empty=true]:text-muted-foreground"
							>
								{selectedDate ? (
									format(selectedDate, "PPP")
								) : (
									<span>Pick a date</span>
								)}
								<ChevronDownIcon data-icon="inline-end" />
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-auto p-0" align="start">
							<Calendar
								mode="single"
								disabled={{ before: minSelectableDate }}
								selected={selectedDate}
								onSelect={(val) =>
									setDate(
										val ? format(val, "yyyy-MM-dd") : null,
									)
								}
								defaultMonth={selectedDate}
							/>
						</PopoverContent>
					</Popover>
				</div>
			</Card>

			<div className="flex w-full flex-row gap-8">
				<div className="flex flex-col gap-4 md:w-1/4">
					<Card className="flex h-fit flex-col gap-4 p-4">
						<div className="flex items-center gap-2">
							<MapPinIcon />
							{createLocationName(user.location)}
						</div>

						<div className="flex items-center gap-2">
							<UsersIcon />
							{t(($) => $.foremanDashboard.team.membersCount, {
								count: total,
							})}
						</div>
					</Card>

					<DailyNotes />
				</div>

				<div className="flex grow flex-col gap-4">
					<ActionCard dangerLevel="danger" />
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
								value={countPerDangerLevel.total.danger}
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
								value={countPerDangerLevel.total.warning}
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
								value={countPerDangerLevel.total.safe}
								totalText={cardTotalText}
								viewDetailsText={cardViewDetailsText}
							/>
						</div>
					</div>
					<AtRiskTable users={subordinates ?? []} />

					{sensor ? (
						<UserStatusChart
							users={subordinates ?? []}
							sensor={sensor}
							// biome-ignore lint/correctness/noUnusedFunctionParameters: TODO: Filter on user
							userOnClick={(userId) => {}}
						/>
					) : (
						<div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
							{sensors.map((s: Sensor) =>
								countPerDangerLevel[s].safe !== 0 ||
								countPerDangerLevel[s].warning !== 0 ||
								countPerDangerLevel[s].danger !== 0 ? (
									<PieChartCard
										data={{
											safe: {
												name: "Safe",
												value: countPerDangerLevel[s]
													.safe,
												label: t(
													($) =>
														$.foremanDashboard
															.overview.statCards
															.withinLimits.label,
												),
											},
											warning: {
												name: "Warning",
												value: countPerDangerLevel[s]
													.warning,
												label: t(
													($) =>
														$.foremanDashboard
															.overview.statCards
															.atRisk.label,
												),
											},
											danger: {
												name: "Danger",
												value: countPerDangerLevel[s]
													.danger,
												label: t(
													($) =>
														$.foremanDashboard
															.overview.statCards
															.inDanger.label,
												),
											},
										}}
										label={s}
										viewDetailsText={cardViewDetailsText}
										to="/"
										key={s}
									/>
								) : null,
							)}
						</div>
					)}
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
