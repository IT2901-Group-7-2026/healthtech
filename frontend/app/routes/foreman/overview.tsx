/** biome-ignore-all lint/suspicious/noAlert: we allow alerts for testing */

import { DailyNotes } from "@/components/daily-notes.js";
import { DatePicker } from "@/components/date-picker";
import { Card } from "@/components/ui/card";
import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { UserStatusChart } from "@/components/users-status-chart";
import { AttentionCard } from "@/features/attention-card/attention-card.js";
import { PieChartCard } from "@/features/attention-card/pie-chart-card";
import { useDate } from "@/features/date-picker/use-date.js";
import { TeamSummary } from "@/features/sidebar/team-summary.js";
import { useUser } from "@/features/user/user-context";
import { useView } from "@/features/views/use-view";
import { ViewPicker } from "@/features/views/view-picker";
import { fetchSubordinatesQueryOptions, fetchThresholdSummaryQueryOptions } from "@/lib/api.js";
import { today, toTZDate } from "@/lib/date";
import type { ThresholdSummary } from "@/lib/dto";
import { parseAsSensor, type Sensor, sensors } from "@/lib/sensors";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { addWeeks, endOfDay, startOfDay, subDays } from "date-fns";
import { parseAsString, useQueryState } from "nuqs";
import { useTranslation } from "react-i18next";
import { UserDetails } from "./user-details";

export default function ForemanOverview() {
	const { t } = useTranslation();
	const { user } = useUser();

	const [sensor, setSensor] = useQueryState("sensor", parseAsSensor);
	const { date, setDate } = useDate();
	const [selectedUserId, setSelectedUserId] = useQueryState("userId", parseAsString);

	const selectedDate = date;
	const { view } = useView();
	const isWeekly = view === "week";

	const startDate = isWeekly ? toTZDate(startOfDay(addWeeks(selectedDate, -1))) : toTZDate(startOfDay(selectedDate));

	const endDate = toTZDate(endOfDay(selectedDate));

	// Foremen can only see dates within the last week
	const minSelectableDate = subDays(today(), 7);
	const maxSelectableDate = today();

	const { data: users } = useQuery(fetchSubordinatesQueryOptions(user.id));
	const { data: subordinates, isLoading: isSubordinatesLoading } = useQuery(
		fetchSubordinatesQueryOptions(user.id, startDate, endDate),
	);
	const { data: thresholdSummary, isLoading: isThresholdSummaryLoading } = useQuery(
		fetchThresholdSummaryQueryOptions(user.id, startDate, endDate),
	);

	const selectedUser = users?.find((subordinate) => subordinate.id === selectedUserId);
	const subordinateCount = subordinates?.length ?? 0;
	const isUserComboboxDisabled = !users || users.length === 0;
	const isUserSelected = selectedUser !== undefined;

	const userComboboxOptions =
		users?.map((u) => ({
			value: u.id,
			label: u.name,
		})) ?? [];

	return (
		<div className="flex flex-col gap-8">
			<Card muted={true} className="flex flex-row justify-between p-2">
				<ToggleGroup
					type="single"
					value={sensor ?? "all"}
					variant="outline"
					className={cn("inline-grid auto-cols-fr grid-flow-col")}
					onValueChange={(value: Sensor | "all" | "") => {
						if (value) {
							setSensor(value === "all" ? null : value);
						}
					}}
				>
					<ToggleGroupItem value="all" aria-label={t(($) => $.sensors.overview)}>
						<p className="text-sm">{t(($) => $.sensors.overview)}</p>
					</ToggleGroupItem>
					<ToggleGroupItem value="dust" aria-label={t(($) => $.sensors.dust)}>
						<p className="text-sm">{t(($) => $.sensors.dust)}</p>
					</ToggleGroupItem>
					<ToggleGroupItem value="noise" aria-label={t(($) => $.sensors.noise)}>
						<p className="text-sm">{t(($) => $.sensors.noise)}</p>
					</ToggleGroupItem>
					<ToggleGroupItem value="vibration" aria-label={t(($) => $.sensors.vibration)}>
						<p className="text-sm">{t(($) => $.sensors.vibration)}</p>
					</ToggleGroupItem>
				</ToggleGroup>

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
							value={selectedUser?.name ?? ""}
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
				</div>
			</Card>

			<div className="flex w-full flex-row gap-6">
				<aside className="flex flex-col gap-6 md:w-1/5">
					<TeamSummary subordinateCount={subordinateCount} />
					<DailyNotes />
				</aside>

				<div
					className="grid w-full gap-6"
					style={{
						gridTemplateColumns: "minmax(0, 3fr) calc(var(--spacing) * 73)",
					}}
				>
					<div className="flex flex-col gap-12">
						{isUserSelected ? (
							<UserDetails selectedUser={selectedUser} selectedDate={selectedDate} sensor={sensor} />
						) : (
							<>
								<AttentionCard
									subordinates={subordinates ?? []}
									isSubordinatesLoading={isSubordinatesLoading}
									thresholdSummary={thresholdSummary}
									isThresholdSummaryLoading={isThresholdSummaryLoading}
									isWeekly={isWeekly}
								/>

								{sensor ? (
									<UserStatusChart
										users={subordinates ?? []}
										sensor={sensor}
										isWeekly={isWeekly}
										userOnClick={(id) => setSelectedUserId(id)}
									/>
								) : (
									<SensorSummaryGrid thresholdSummary={thresholdSummary} />
								)}
							</>
						)}
					</div>

					<aside className="flex flex-col gap-4">
						<Card muted={true}>
							<ViewPicker allowedViews={["day", "week"]} withNavigationButtons={true} />
						</Card>

						<Card muted={true}>
							<DatePicker
								mode="day"
								showWeekNumber={true}
								date={date}
								onDateChange={setDate}
								disabled={{
									before: minSelectableDate,
									after: maxSelectableDate,
								}}
								pagedNavigation={false}
								hideNavigation={true}
								disableNavigation={true}
								captionLayout="label"
							/>
						</Card>
					</aside>
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
		<div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-3">
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
					label={t(($) => $.sensors[sensorType])}
					to={`?sensor=${sensorType}`}
					key={sensorType}
					sensorType={sensorType}
				/>
			))}
		</div>
	);
}
