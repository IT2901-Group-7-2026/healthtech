/** biome-ignore-all lint/suspicious/noAlert: we allow alerts for testing */

import { DailyNotes } from "@/components/daily-notes.js";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserStatusChart } from "@/components/users-status-chart";
import { AttentionCard } from "@/features/attention-card/attention-card.js";
import { PieChartCard } from "@/features/attention-card/pie-chart-card";
import { TeamSummary } from "@/features/sidebar/team-summary.js";
import { useUser } from "@/features/user/user-context";
import { useFormatDate } from "@/hooks/use-format-date";
import { fetchSubordinatesQueryOptions, fetchThresholdSummaryQueryOptions } from "@/lib/api.js";
import { now, parseAsTZDate, today, toTZDate } from "@/lib/date";
import type { ThresholdSummary } from "@/lib/dto";
import { parseAsSensor, type Sensor, sensors } from "@/lib/sensors";
import { useQuery } from "@tanstack/react-query";
import { addWeeks, endOfDay, startOfDay } from "date-fns";
import { ChevronDownIcon } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { UserDetails } from "./user-details";

export default function ForemanOverview() {
	const { t } = useTranslation();
	const formatDate = useFormatDate();
	const { user } = useUser();

	const [sensor, setSensor] = useQueryState("sensor", parseAsSensor);
	const [date, setDate] = useQueryState("filterDate", parseAsTZDate.withDefault(today()));
	const [selectedUserId, setSelectedUserId] = useQueryState("userId", parseAsString);

	const selectedDate = date;

	const startDate = startOfDay(selectedDate);
	const endDate = endOfDay(selectedDate);

	// Foremen can only see dates within the last week
	const minSelectableDate = startOfDay(addWeeks(today(), -1));
	const maxSelectableDate = now();

	const { data: users } = useQuery(fetchSubordinatesQueryOptions(user.id));
	const { data: subordinates, isLoading: isSubordinatesLoading } = useQuery(
		fetchSubordinatesQueryOptions(user.id, startDate, endDate),
	);
	const { data: thresholdSummary, isLoading: isThresholdSummaryLoading } = useQuery(
		fetchThresholdSummaryQueryOptions(user.id, startDate, endDate),
	);

	const selectedUser = users?.find((subordinate) => subordinate.id === selectedUserId);
	const subordinateCount = subordinates?.length ?? 0;
	const isUserSelected = selectedUser !== undefined;
	const isUserComboboxDisabled = !users || users.length === 0;

	const userComboboxOptions =
		users?.map((u) => ({
			value: u.id,
			label: u.username,
		})) ?? [];

	return (
		<div className="flex flex-col gap-8">
			<Card muted={true} className="flex flex-row justify-between p-2">
				<Tabs
					value={sensor ?? "all"}
					onValueChange={(value) => setSensor(value === "all" ? null : (value as Sensor))}
				>
					<TabsList className="bg-transparent">
						<SensorTabsTrigger value="all">{t(($) => $.allSensors)}</SensorTabsTrigger>
						<SensorTabsTrigger value="dust">{t(($) => $.dust)}</SensorTabsTrigger>
						<SensorTabsTrigger value="noise">{t(($) => $.noise)}</SensorTabsTrigger>
						<SensorTabsTrigger value="vibration">{t(($) => $.vibration)}</SensorTabsTrigger>
					</TabsList>
				</Tabs>

				<div className="flex flex-end flex-row gap-4">
					<Combobox
						items={userComboboxOptions}
						disabled={isUserComboboxDisabled}
						value={selectedUserId ?? undefined}
						onValueChange={(value) => setSelectedUserId(value)}
					>
						<ComboboxInput
							placeholder={t(($) => $.foremanDashboard.overview.selectUserPlaceholder)}
							showClear={true}
							disabled={isUserComboboxDisabled}
							className="bg-background dark:bg-input/30"
							value={selectedUser?.username ?? ""}
						/>
						<ComboboxContent>
							<ComboboxList>
								{(item) => (
									<ComboboxItem key={item.value} value={item.value}>
										{item.label}
									</ComboboxItem>
								)}
							</ComboboxList>
						</ComboboxContent>
					</Combobox>

					<Popover>
						<PopoverTrigger asChild={true}>
							<Button
								variant={"outline"}
								data-empty={!date}
								className="w-52 justify-between text-left font-normal data-[empty=true]:text-muted-foreground"
							>
								{formatDate(selectedDate, "PPP")}
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
								onSelect={(val) => {
									if (!val) {
										setDate(null);
										return;
									}

									const nextDate = startOfDay(toTZDate(val));
									setDate(nextDate);
								}}
								defaultMonth={selectedDate}
							/>
						</PopoverContent>
					</Popover>
				</div>
			</Card>

			<div className="flex w-full flex-row gap-6">
				<aside className="flex flex-col gap-6 md:w-1/5">
					<TeamSummary subordinateCount={subordinateCount} />
					<DailyNotes />
				</aside>

				<div className="flex flex-col gap-12 md:w-3/5">
					{isUserSelected ? (
						<UserDetails selectedUser={selectedUser} selectedDate={selectedDate} sensor={sensor} />
					) : (
						<>
							<AttentionCard
								subordinates={subordinates ?? []}
								isSubordinatesLoading={isSubordinatesLoading}
								thresholdSummary={thresholdSummary}
								isThresholdSummaryLoading={isThresholdSummaryLoading}
							/>

							{sensor ? (
								<UserStatusChart users={subordinates ?? []} sensor={sensor} userOnClick={() => {}} />
							) : (
								<SensorSummaryGrid thresholdSummary={thresholdSummary} />
							)}
						</>
					)}
				</div>
			</div>
		</div>
	);
}

function SensorSummaryGrid({ thresholdSummary }: { thresholdSummary: ThresholdSummary | undefined }) {
	const { t } = useTranslation();

	if (thresholdSummary === undefined) {
		return null;
	}

	return (
		<div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
			{sensors.map((sensorType: Sensor) => (
				<PieChartCard
					data={{
						safe: {
							name: "Safe",
							value: thresholdSummary[sensorType].safe,
							label: t(($) => $.foremanDashboard.overview.statCards.safe.label),
						},
						warning: {
							name: "Warning",
							value: thresholdSummary[sensorType].warning,
							label: t(($) => $.foremanDashboard.overview.statCards.warning.label),
						},
						danger: {
							name: "Danger",
							value: thresholdSummary[sensorType].danger,
							label: t(($) => $.foremanDashboard.overview.statCards.danger.label),
						},
					}}
					label={t(($) => $[sensorType])}
					to={`?sensor=${sensorType}`}
					key={sensorType}
					sensorType={sensorType}
				/>
			))}
		</div>
	);
}

function SensorTabsTrigger({ value, children }: { value: Sensor | "all"; children: ReactNode }) {
	return (
		<TabsTrigger value={value} className="p-4 data-[state=active]:bg-neutral-900 data-[state=active]:text-white">
			{children}
		</TabsTrigger>
	);
}
