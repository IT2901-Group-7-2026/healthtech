/** biome-ignore-all lint/suspicious/noAlert: we allow alerts for testing */

import { DailyNotes } from "@/components/daily-notes.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Calendar } from "@/components/ui/calendar.tsx";
import { Card } from "@/components/ui/card.tsx";
import {
	Combobox,
	ComboboxContent,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "@/components/ui/combobox.tsx";
import { DustChart } from "@/components/ui/dust-chart.tsx";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover.tsx";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { UserStatusChart } from "@/components/users-status-chart.tsx";
import { AttentionCard } from "@/features/attention-card/attention-card.tsx";
import { TeamSummary } from "@/features/sidebar/team-summary.tsx";
import { useUser } from "@/features/user/user-context.tsx";
import { useFormatDate } from "@/hooks/use-format-date.ts";
import {
	fetchSubordinatesQueryOptions,
	fetchThresholdSummaryQueryOptions,
	sensorQueryOptions,
	usersQueryOptions,
} from "@/lib/api.ts";
import { buildSensorQuery } from "@/lib/sensor-query-utils.ts";
import { parseAsSensor, type Sensor, sensors } from "@/lib/sensors.ts";
import { thresholds } from "@/lib/thresholds.ts";
import { useQuery } from "@tanstack/react-query";
import { addWeeks, endOfDay, parseISO, startOfDay } from "date-fns";
import { ChevronDownIcon } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { PieChartCard } from "../../features/attention-card/pie-chart-card.tsx";

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: help
export default function ForemanOverview() {
	const { t } = useTranslation();
	const formatDate = useFormatDate();

	const [sensor, setSensor] = useQueryState("sensor", parseAsSensor);
	const [date, setDate] = useQueryState(
		"filterDate",
		parseAsString.withDefault(formatDate(new Date(), "yyyy-MM-dd")),
	);

	const { data: users } = useQuery(usersQueryOptions());

	// TODO: Use this to show data for only that user
	const [selectedUserId, setSelectedUserId] = useQueryState(
		"userId",
		parseAsString,
	);
	const selectedUser = users?.find((u) => u.id === selectedUserId);

	const selectedDate = parseISO(date);

	const startDate = startOfDay(selectedDate);
	const endDate = endOfDay(selectedDate);

	// Foremen can only see dates within the last week
	const minSelectableDate = startOfDay(addWeeks(new Date(), -1));
	const maxSelectableDate = new Date();

	const { user } = useUser();

	const isDustQueriesEnabled = Boolean(selectedUserId);

	const { data: dustTwa1Data } = useQuery(
		sensorQueryOptions({
			sensor: "dust",
			query: buildSensorQuery("dust", "day", selectedDate, {
				granularity: "day",
				aggregationFunction: "avg",
				field: "pm1_twa",
			}),
			userId: selectedUserId ?? undefined,
			enabled: isDustQueriesEnabled,
		}),
	);

	const { data: dustTwa25Data } = useQuery(
		sensorQueryOptions({
			sensor: "dust",
			query: buildSensorQuery("dust", "day", selectedDate, {
				granularity: "day",
				aggregationFunction: "avg",
				field: "pm25_twa",
			}),
			userId: selectedUserId ?? undefined,
			enabled: isDustQueriesEnabled,
		}),
	);

	const { data: dustTwa10Data } = useQuery(
		sensorQueryOptions({
			sensor: "dust",
			query: buildSensorQuery("dust", "day", selectedDate, {
				granularity: "day",
				aggregationFunction: "avg",
				field: "pm10_twa",
			}),
			userId: selectedUserId ?? undefined,
			enabled: isDustQueriesEnabled,
		}),
	);

	const { data: subordinates, isLoading: isSubordinatesLoading } = useQuery(
		fetchSubordinatesQueryOptions(user.id, startDate, endDate),
	);

	const { data: thresholdSummary, isLoading: isThresholdSummaryLoading } =
		useQuery(
			fetchThresholdSummaryQueryOptions(user.id, startDate, endDate),
		);

	const subordinateCount = subordinates?.length ?? 0;
	const isUserComboboxDisabled = !users || users.length === 0;

	//TODO: Update card links to point to stats page

	const userComboboxOptions =
		users?.map((u) => ({
			value: u.id,
			label: u.username,
		})) ?? [];

	return (
		<div className="flex flex-col gap-8">
			<Card muted className="flex flex-row justify-between p-2">
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
						<SensorTabsTrigger value="dust">
							{t(($) => $.dust)}
						</SensorTabsTrigger>
						<SensorTabsTrigger value="noise">
							{t(($) => $.noise)}
						</SensorTabsTrigger>
						<SensorTabsTrigger value="vibration">
							{t(($) => $.vibration)}
						</SensorTabsTrigger>
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
							placeholder={t(
								($) =>
									$.foremanDashboard.overview
										.selectUserPlaceholder,
							)}
							showClear
							disabled={isUserComboboxDisabled}
							className="bg-background dark:bg-input/30"
							value={selectedUser?.username ?? ""}
						/>
						<ComboboxContent>
							<ComboboxList>
								{(item) => (
									<ComboboxItem
										key={item.value}
										value={item.value}
									>
										{item.label}
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
								onSelect={(val) =>
									setDate(
										val
											? formatDate(val, "yyyy-MM-dd")
											: null,
									)
								}
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
					<AttentionCard
						subordinates={subordinates ?? []}
						isSubordinatesLoading={isSubordinatesLoading}
						thresholdSummary={thresholdSummary}
						isThresholdSummaryLoading={isThresholdSummaryLoading}
					/>

					{sensor ? (
						<UserStatusChart
							users={subordinates ?? []}
							sensor={sensor}
							// biome-ignore lint/correctness/noUnusedFunctionParameters: TODO: Filter on user
							userOnClick={(userId) => {}}
						/>
					) : (
						<div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
							{/* TODO: add skeleton loading using isThresholdSummaryLoading */}
							{thresholdSummary !== undefined &&
								sensors.map((s: Sensor) => (
									<PieChartCard
										data={{
											safe: {
												name: "Safe",
												value: thresholdSummary[s].safe,
												label: t(
													($) =>
														$.foremanDashboard
															.overview.statCards
															.safe.label,
												),
											},
											warning: {
												name: "Warning",
												value: thresholdSummary[s]
													.warning,
												label: t(
													($) =>
														$.foremanDashboard
															.overview.statCards
															.warning.label,
												),
											},
											danger: {
												name: "Danger",
												value: thresholdSummary[s]
													.danger,
												label: t(
													($) =>
														$.foremanDashboard
															.overview.statCards
															.danger.label,
												),
											},
										}}
										label={s}
										to="/"
										key={s}
										sensorType={s}
									/>
								))}
						</div>
					)}
					{selectedUserId && (
						<div className="flex flex-row items-center gap-8">
							{dustTwa1Data && dustTwa1Data.length > 0 && (
								<DustChart
									label="PM1 TWA"
									value={dustTwa1Data[0].value}
									thresholdValue={thresholds.dust.danger}
								/>
							)}

							{dustTwa25Data && dustTwa25Data.length > 0 && (
								<DustChart
									label="PM2.5 TWA"
									value={dustTwa25Data[0].value}
									thresholdValue={thresholds.dust.danger}
								/>
							)}

							{dustTwa10Data && dustTwa10Data.length > 0 && (
								<DustChart
									label="PM10 TWA"
									value={dustTwa10Data[0].value}
									thresholdValue={thresholds.dust.danger}
								/>
							)}
						</div>
					)}
				</div>
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
