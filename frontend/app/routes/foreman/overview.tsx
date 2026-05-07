import { DatePicker } from "@/components/date-picker.tsx";
import { ExposureIcon } from "@/components/exposure-icon.tsx";
import { NotesCard } from "@/components/notes-card.tsx";
import { OperatorExposureStatusTable } from "@/components/operator-exposure-status-table.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group.tsx";
import { UserStatusChart } from "@/components/users-status-chart.tsx";
import { AttentionCard } from "@/features/attention-card/attention-card.tsx";
import { PieChartCard } from "@/features/attention-card/pie-chart-card.tsx";
import { useDate } from "@/features/date-picker/use-date.ts";
import { LimitExplanation } from "@/features/sidebar/limit-explanation.tsx";
import { TeamSummary } from "@/features/sidebar/team-summary.tsx";
import { useUser } from "@/features/user/user-context.tsx";
import { UserSelect } from "@/features/user/user-select.tsx";
import { useView } from "@/features/views/use-view.ts";
import { ViewPicker } from "@/features/views/view-picker.tsx";
import type { TranslateFn } from "@/i18n/config.ts";
import { fetchSubordinatesQueryOptions, fetchThresholdSummaryQueryOptions } from "@/lib/api.ts";
import { today } from "@/lib/date.ts";
import type { ThresholdSummary } from "@/lib/dto/threshold.ts";
import type { User } from "@/lib/dto/user.ts";
import { type Exposure, exposures, parseAsExposure } from "@/lib/exposures.ts";
import { useQuery } from "@tanstack/react-query";
import { subDays } from "date-fns";
import { XIcon } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useTranslation } from "react-i18next";
import { UserDetails } from "./user-details.tsx";

export default function ForemanOverview() {
	const { t } = useTranslation();
	const { user } = useUser();

	const [exposure, setExposure] = useQueryState("exposure", parseAsExposure.withOptions({ history: "push" }));
	const {
		date,
		setDate,
		selection: { start: startDate, end: endDate },
	} = useDate();
	const [selectedUserId, setSelectedUserId] = useQueryState("userId", parseAsString.withOptions({ history: "push" }));

	const { view } = useView();
	const isWeekly = view === "week";

	// Foremen can only see dates within the last week
	const minSelectableDate = subDays(today(), 7);
	const maxSelectableDate = today();

	const { data: users } = useQuery(fetchSubordinatesQueryOptions(user.id));
	const {
		data: subordinates,
		isLoading: isSubordinatesLoading,
		error: subordinatesError,
	} = useQuery(fetchSubordinatesQueryOptions(user.id, startDate, endDate));
	const { data: thresholdSummary, isLoading: isThresholdSummaryLoading } = useQuery(
		fetchThresholdSummaryQueryOptions(user.id, startDate, endDate),
	);

	const selectedUser = users?.find((subordinate) => subordinate.id === selectedUserId);
	const subordinateCount = subordinates?.length ?? 0;
	const isUserSelected = selectedUser !== undefined;

	const title = resolveForemanOverviewTitle(t, exposure, selectedUser);

	return (
		<div className="flex flex-col gap-8">
			<header className="flex w-full min-w-0 flex-col gap-4">
				<div className="min-w-0">
					<div className="flex min-w-0 items-center gap-2 md:gap-3">
						<ExposureIcon type={exposure ?? "all"} size="lg" className="mt-0.5 shrink-0 md:mt-1" />
						<h1 className="min-w-0 max-w-prose text-balance font-medium text-lg leading-tight md:text-2xl lg:text-3xl">
							{title}
						</h1>
					</div>
				</div>

				<div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-center md:gap-6">
					<div className="grid w-full grid-cols-[auto_1fr] items-center gap-3">
						<div className="flex gap-1">
							<ToggleGroup
								type="single"
								value={exposure ?? "all"}
								variant="outline"
								onValueChange={(value: Exposure | "") => {
									setExposure(value || null);
								}}
							>
								<ToggleGroupItem
									value="dust"
									aria-label={t(($) => $.exposures.dust)}
									className="rounded-l-xl! px-2 lg:px-3"
								>
									<ExposureIcon type="dust" iconOnly={true} iconClassName="size-4" />
									<p className="min-w-0 text-xs lg:text-sm">{t(($) => $.exposures.dust)}</p>
								</ToggleGroupItem>
								<ToggleGroupItem
									value="noise"
									aria-label={t(($) => $.exposures.noise)}
									className="px-2 lg:px-3"
								>
									<ExposureIcon type="noise" iconOnly={true} iconClassName="size-4" />
									<p className="min-w-0 text-xs lg:text-sm">{t(($) => $.exposures.noise)}</p>
								</ToggleGroupItem>
								<ToggleGroupItem
									value="vibration"
									aria-label={t(($) => $.exposures.vibration)}
									className="rounded-r-md! px-2 lg:px-3"
								>
									<ExposureIcon type="vibration" iconOnly={true} iconClassName="size-4" />
									<p className="min-w-0 text-xs lg:text-sm">{t(($) => $.exposures.vibration)}</p>
								</ToggleGroupItem>
							</ToggleGroup>

							<Button
								type="button"
								aria-label={t(($) => $.foremanDashboard.overview.clearExposureFilter)}
								variant="outline"
								size="icon"
								onClick={() => setExposure(null)}
								disabled={exposure === null}
								className="shrink-0 rounded-r-xl"
							>
								<XIcon className="size-4" aria-hidden="true" />
							</Button>
						</div>

						{users === undefined || isSubordinatesLoading ? (
							<Skeleton className="h-9 w-73 justify-self-end" />
						) : (
							<div className="w-73 min-w-0 justify-self-end">
								<UserSelect
									users={users}
									value={selectedUserId}
									onValueChange={setSelectedUserId}
									placeholder={t(($) => $.foremanDashboard.overview.selectUserPlaceholder)}
								/>
							</div>
						)}
					</div>
				</div>
			</header>

			<div className="flex w-full flex-row gap-6">
				<aside className="flex flex-col gap-6 md:w-1/5">
					<TeamSummary subordinateCount={subordinateCount} />
					<NotesCard />
					<LimitExplanation />
				</aside>

				<div
					className="grid w-full gap-6"
					style={{
						gridTemplateColumns: "minmax(0, 3fr) calc(var(--spacing) * 73)",
					}}
				>
					<div className="flex flex-col gap-12">
						{/* TODO: Redo the loading logic here */}
						{isUserSelected ? (
							<UserDetails selectedUser={selectedUser} exposure={exposure} />
						) : (
							<>
								<AttentionCard
									subordinates={subordinates ?? []}
									isSubordinatesLoading={isSubordinatesLoading}
									thresholdSummary={thresholdSummary}
									isThresholdSummaryLoading={isThresholdSummaryLoading}
								/>

								{exposure ? (
									<UserStatusChart
										users={subordinates ?? []}
										exposure={exposure}
										isWeekly={isWeekly}
										userOnClick={(id) => setSelectedUserId(id)}
									/>
								) : (
									<>
										<ExposureSummaryGrid thresholdSummary={thresholdSummary} />

										<div className="flex flex-col gap-4">
											<h2 className="font-medium text-lg">
												{t(($) => $.foremanDashboard.team.title)}
											</h2>
											{isSubordinatesLoading ? (
												<div className="p-4">{t(($) => $.common.loading)}</div>
											) : subordinatesError ? (
												<div className="p-4 text-destructive">
													{t(($) => $.foremanDashboard.team.failedToLoadMembers)}
												</div>
											) : !subordinates || subordinates.length === 0 ? (
												<div className="p-4">
													{t(($) => $.foremanDashboard.team.noMembersFound)}
												</div>
											) : (
												<OperatorExposureStatusTable data={subordinates} />
											)}
										</div>
									</>
								)}
							</>
						)}
					</div>

					<aside className="flex flex-col gap-4">
						<Card muted={true}>
							<ViewPicker
								allowedViews={["day", "week"]}
								withNavigationButtons={true}
								minDate={minSelectableDate}
								maxDate={maxSelectableDate}
							/>
						</Card>

						<Card muted={true}>
							<DatePicker
								mode={view}
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

function ExposureSummaryGrid({ thresholdSummary }: { thresholdSummary: ThresholdSummary | undefined }) {
	const { t } = useTranslation();

	if (thresholdSummary === undefined) {
		return null;
	}

	return (
		<div className="flex flex-col gap-4">
			<h2 className="font-medium text-lg">{t(($) => $.foremanDashboard.overview.exposure)}</h2>
			<div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-3">
				{exposures.map((exposureType) => (
					<PieChartCard
						data={{
							safe: thresholdSummary[exposureType].safe,
							warning: thresholdSummary[exposureType].warning,
							danger: thresholdSummary[exposureType].danger,
						}}
						label={t(($) => $.exposures[exposureType])}
						to={`?exposure=${exposureType}`}
						key={exposureType}
						exposureType={exposureType}
					/>
				))}
			</div>
		</div>
	);
}

function resolveForemanOverviewTitle(t: TranslateFn, exposure: Exposure | null, selectedUser: User | undefined) {
	const exposureTitle = exposure
		? t(($) => $.exposures[exposure]).toLowerCase()
		: t(($) => $.operatorHeader.subtitle.allExposureTypes).toLowerCase();

	if (selectedUser) {
		if (exposure === null) {
			return t(($) => $.foremanDashboard.overview.title.allForUser, {
				exposure: exposureTitle,
				name: selectedUser.name,
			});
		}

		return t(($) => $.foremanDashboard.overview.title.exposureForUser, {
			exposure: exposureTitle,
			name: selectedUser.name,
		});
	}

	if (exposure === null) {
		return t(($) => $.foremanDashboard.overview.title.all, {
			exposure: exposureTitle,
		});
	}

	return t(($) => $.foremanDashboard.overview.title.exposure, {
		exposure: exposureTitle,
	});
}
