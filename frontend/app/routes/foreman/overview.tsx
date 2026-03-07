/** biome-ignore-all lint/suspicious/noAlert: we allow alerts for testing */

import { DailyNotes } from "@/components/daily-notes.js";
import { ExposureRiskCard } from "@/components/exposure-level-card";
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
import { useFormatDate } from "@/hooks/use-format-date";
import { fetchSubordinatesQueryOptions, usersQueryOptions } from "@/lib/api.js";
import type { DangerLevel } from "@/lib/danger-levels";
import { createLocationName, type UserWithStatusDto } from "@/lib/dto.js";
import { parseAsSensor, type Sensor, sensors } from "@/lib/sensors";
import { useQuery } from "@tanstack/react-query";
import { addWeeks, endOfDay, isToday, parseISO, startOfDay } from "date-fns";
import { ChevronDownIcon, MapPinIcon, UsersIcon } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { type ReactNode, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActionCard } from "./action-card";
import { AtRiskPopup } from "./exposure-level-popup";
import { PieChartCard } from "./pie-chart-card";
import { StatCard } from "./stat-card";

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: help
export default function ForemanOverview() {
	const { t } = useTranslation();
	const formatDate = useFormatDate();

	const [sensor, setSensor] = useQueryState("sensor", parseAsSensor);
	const [date, setDate] = useQueryState(
		"filterDate",
		parseAsString.withDefault(formatDate(new Date(), "yyyy-MM-dd")),
	);

	// TODO: Use this to show data for only that user
	const [selectedUser, setSelectedUser] = useQueryState("user", parseAsString);

	const selectedDate = date ? parseISO(date) : undefined;

	const startDate = selectedDate ? startOfDay(selectedDate) : undefined;
	const endDate = selectedDate ? endOfDay(selectedDate) : undefined;

	// Foremen can only see dates within the last week
	const minSelectableDate = startOfDay(addWeeks(new Date(), -1));
	const maxSelectableDate = new Date();

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

	const { data: subordinates, isLoading: isSubordinatesLoading } = useQuery(
		fetchSubordinatesQueryOptions(user.id, startDate, endDate),
	);

	const { data: users } = useQuery(usersQueryOptions());

	const addSubordinateDangerLevel = useCallback(
		(
			result: Record<Sensor | "total", Record<DangerLevel, number>>,
			subordinate: UserWithStatusDto,
		) => {
			result.total[subordinate.status.status]++;

			for (const sensorType of sensors) {
				const level = subordinate.status[sensorType]?.dangerLevel;

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

	const highestDangerLevel = useMemo(() => {
		if (subordinates === undefined || subordinates.length === 0) {
			return "safe";
		}

		if (countPerDangerLevel.total.danger > 0) {
			return "danger";
		}

		if (countPerDangerLevel.total.warning > 0) {
			return "warning";
		}

		return "safe";
	}, [countPerDangerLevel, subordinates]);

	const total = subordinates?.length ?? 0;

	const selectedSensorKey = sensor ?? "total";

	const cardTotalText = t(($) => $.foremanDashboard.overview.statCards.total);

	const isUserComboboxDisabled = !users || users.length === 0;
	const showActionCard = selectedDate ? isToday(selectedDate) : false;

	//TODO: Update card links to point to stats page

	return (
		<div>
			<Card className="mb-4 flex flex-row justify-between px-4 py-2">
				<Tabs
					value={sensor ?? "all"}
					onValueChange={(value) =>
						setSensor(value === "all" ? null : (value as Sensor))
					}
				>
					<TabsList className="bg-transparent">
						<SensorTabsTrigger value="all">
							{t(($) => $.allSensors)}
						</SensorTabsTrigger>
						<SensorTabsTrigger value="vibration">
							{t(($) => $.vibration)}
						</SensorTabsTrigger>
						<SensorTabsTrigger value="noise">
							{t(($) => $.noise)}
						</SensorTabsTrigger>
						<SensorTabsTrigger value="dust">
							{t(($) => $.dust)}
						</SensorTabsTrigger>
					</TabsList>
				</Tabs>
				<div className="flex flex-end flex-row gap-4">
					<Combobox
						items={users?.map((u) => u.username) ?? []}
						disabled={isUserComboboxDisabled}
						value={selectedUser ?? undefined}
						onValueChange={(value) => setSelectedUser(value)}
					>
						<ComboboxInput
							placeholder={t(
								($) => $.foremanDashboard.overview.selectUserPlaceholder,
							)}
							showClear
							disabled={isUserComboboxDisabled}
						/>
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
								className="w-52 justify-between text-left font-normal data-[empty=true]:text-muted-foreground"
							>
								{selectedDate ? (
									formatDate(selectedDate, "PPP")
								) : (
									<span>
										{t(
											($) => $.foremanDashboard.overview.selectDatePlaceholder,
										)}
									</span>
								)}
								<ChevronDownIcon data-icon="inline-end" />
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-auto p-0" align="start">
							<Calendar
								mode="single"
								disabled={{
									before: minSelectableDate,
									after: maxSelectableDate,
								}}
								selected={selectedDate}
								onSelect={(val) =>
									setDate(val ? formatDate(val, "yyyy-MM-dd") : null)
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
					{showActionCard && (
						<ActionCard
							dangerLevel={highestDangerLevel}
							isLoading={isSubordinatesLoading}
						/>
					)}

					<div className="grid gap-6 lg:grid-cols-3">
						<div className="grid items-stretch gap-4 md:grid-cols-2 lg:col-span-3 lg:grid-cols-3">
							{!sensor && (
								<>
									<StatCard
										description={t(
											($) =>
												$.foremanDashboard.overview.statCards.danger
													.description,
										)}
										label={t(
											($) => $.foremanDashboard.overview.statCards.danger.label,
										)}
										onClick={() => openForStatus("danger")}
										to="/"
										totalValue={total}
										value={countPerDangerLevel[selectedSensorKey].danger}
										totalText={cardTotalText}
									/>
									<StatCard
										description={t(
											($) =>
												$.foremanDashboard.overview.statCards.warning
													.description,
										)}
										label={t(
											($) =>
												$.foremanDashboard.overview.statCards.warning.label,
										)}
										onClick={() => openForStatus("warning")}
										to="/"
										totalValue={total}
										value={countPerDangerLevel[selectedSensorKey].warning}
										totalText={cardTotalText}
									/>
									<StatCard
										description={t(
											($) =>
												$.foremanDashboard.overview.statCards.safe.description,
										)}
										label={t(
											($) => $.foremanDashboard.overview.statCards.safe.label,
										)}
										onClick={() => openForStatus("safe")}
										to="/"
										totalValue={total}
										value={countPerDangerLevel[selectedSensorKey].safe}
										totalText={cardTotalText}
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
												value: countPerDangerLevel[s].safe,
												label: t(
													($) =>
														$.foremanDashboard.overview.statCards.safe.label,
												),
											},
											warning: {
												name: "Warning",
												value: countPerDangerLevel[s].warning,
												label: t(
													($) =>
														$.foremanDashboard.overview.statCards.warning.label,
												),
											},
											danger: {
												name: "Danger",
												value: countPerDangerLevel[s].danger,
												label: t(
													($) =>
														$.foremanDashboard.overview.statCards.danger.label,
												),
											},
										}}
										label={s}
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

function SensorTabsTrigger({
	value,
	children,
}: {
	value: Sensor | "all";
	children: ReactNode;
}) {
	return (
		<TabsTrigger
			value={value}
			className="p-4 data-[state=active]:bg-neutral-900 data-[state=active]:text-white"
		>
			{children}
		</TabsTrigger>
	);
}
