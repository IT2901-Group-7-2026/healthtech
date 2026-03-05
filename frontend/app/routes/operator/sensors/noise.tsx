/** biome-ignore-all lint/suspicious/noAlert: we allow alerts for testing */

import { DailyNotes } from "@/components/daily-notes";
import { ChartLineDefault, ThresholdLine } from "@/components/line-chart";
import { Summary } from "@/components/summary";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarWidget } from "@/features/calendar-widget/calendar-widget";
import { mapSensorDataToMonthLists } from "@/features/calendar-widget/data-transform";
import { useDate } from "@/features/date-picker/use-date";
import { useUser } from "@/features/user/user-context";
import { useView } from "@/features/views/use-view";
import { mapWeekDataToEvents } from "@/features/week-widget/data-transform";
import { WeekWidget } from "@/features/week-widget/week-widget";
import { useExportPDF } from "@/hooks/use-export-pdf";
import { getLocale } from "@/i18n/locale";
import { sensorQueryOptions } from "@/lib/api";
import {
	type Aggregation,
	Aggregations,
	type SensorDataRequestDto,
	type SensorDataResponseDto,
} from "@/lib/dto";
import type { Sensor } from "@/lib/sensors";
import { thresholds } from "@/lib/thresholds";
import { computeYAxisRange } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { endOfMonth, endOfWeek, startOfMonth, startOfWeek } from "date-fns";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useTranslation } from "react-i18next";

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: help
export default function Noise() {
	const { view } = useView();
	const { t, i18n } = useTranslation();

	const { date } = useDate();
	const { user } = useUser();
	const { exportToPDF } = useExportPDF();

	const parseAsAggregation = parseAsStringLiteral(Aggregations);

	const [aggregation, setAggregation] = useQueryState<Aggregation>(
		"aggregation",
		parseAsAggregation.withDefault("average"),
	);
	const usePeakData = aggregation === "peak";

	const sensor: Sensor = "noise";

	const dayQuery: SensorDataRequestDto = {
		startTime: new Date(date.setUTCHours(8)),
		endTime: new Date(date.setUTCHours(16)),
		granularity: "minute",
		function: "avg",
	};

	const weekQuery: SensorDataRequestDto = {
		startTime: startOfWeek(date, { weekStartsOn: 1 }),
		endTime: endOfWeek(date, { weekStartsOn: 1 }),
		granularity: "hour",
		function: "avg",
	};

	const monthQuery: SensorDataRequestDto = {
		startTime: startOfMonth(date),
		endTime: endOfMonth(date),
		granularity: "day",
		function: "avg",
	};

	const query =
		view === "day" ? dayQuery : view === "week" ? weekQuery : monthQuery;

	const { data, isLoading, isError } = useQuery(
		sensorQueryOptions({
			sensor: "noise",
			query,
			userId: user.id,
		}),
	);

	// Tighten vertical padding for noise charts so graph fills more of the card
	const { minY, maxY } = computeYAxisRange(data ?? [], {
		step: usePeakData ? 130 : undefined,
	});

	if (isLoading) {
		return (
			<NoisePageLayout data={data ?? []}>
				<Card className="flex h-24 w-full items-center">
					<p>{t(($) => $.loadingData)}</p>
				</Card>
			</NoisePageLayout>
		);
	}

	return (
		<div className="flex w-full flex-col-reverse gap-4 md:flex-row">
			<div className="flex flex-col gap-4 md:w-1/4">
				<Summary exposureType={"noise"} data={data} />
				<DailyNotes />
			</div>
			<div className="flex flex-1 flex-col items-end gap-4">
				{isLoading ? (
					<Card className="flex h-24 w-full items-center">
						<p>{t(($) => $.loadingData)}</p>
					</Card>
				) : isError ? (
					<Card className="flex h-24 w-full items-center">
						<p>{t(($) => $.errorLoadingData)}</p>
					</Card>
				) : view === "month" ? (
					<AggregationTabs
						aggregation={aggregation}
						setAggregation={setAggregation}
					>
						<CalendarWidget
							selectedDay={date}
							selectedAggregation={aggregation}
							data={
								mapSensorDataToMonthLists(
									data ?? [],
									"noise",
									usePeakData,
								) ?? []
							}
						/>
					</AggregationTabs>
				) : view === "week" ? (
					<AggregationTabs
						aggregation={aggregation}
						setAggregation={setAggregation}
					>
						<WeekWidget
							aggregation={aggregation}
							locale={getLocale(i18n.language)}
							dayStartHour={8}
							dayEndHour={16}
							weekStartsOn={1}
							minuteStep={60}
							events={mapWeekDataToEvents(
								data ?? [],
								usePeakData,
							)}
						/>
					</AggregationTabs>
				) : !data || data.length === 0 ? (
					<Card className="flex h-24 w-full items-center">
						<CardTitle>
							{date.toLocaleDateString(i18n.language, {
								day: "numeric",
								month: "long",
								year: "numeric",
							})}
						</CardTitle>
						<p>{t(($) => $.noData)}</p>
					</Card>
				) : (
					<div className="w-full">
						<div className="mb-2 flex justify-end"></div>
						{/* biome-ignore lint/correctness/useUniqueElementIds: required for PDF export */}
						<div id="noise-chart-container">
							<AggregationTabs
								aggregation={aggregation}
								setAggregation={setAggregation}
							>
								<ChartLineDefault
									usePeakData={usePeakData}
									chartData={data ?? []}
									chartTitle={date.toLocaleDateString(
										i18n.language,
										{
											day: "numeric",
											month: "long",
											year: "numeric",
										},
									)}
									unit="db (TWA)"
									startHour={8}
									endHour={16}
									maxY={maxY}
									minY={minY}
									lineType="monotone"
									sensor={sensor}
									headerRight={
										<Button
											size="sm"
											variant="outline"
											onClick={() =>
												exportToPDF(
													"noise-chart-container",
													`${date.toLocaleDateString(
														i18n.language,
														{
															day: "numeric",
															month: "long",
															year: "numeric",
														},
													)}-${user.username}-Noise-Exposure-Overview`,
													`Noise Exposure - ${user.username} - ${date.toLocaleDateString(i18n.language)}`,
												)
											}
										>
											{t(
												($) =>
													$.vibrationExposure.export,
											)}
										</Button>
									}
								>
									<ThresholdLine
										y={
											usePeakData
												? // biome-ignore lint/style/noNonNullAssertion: If usePeakData is true and peakDangerLevel is null, there is a bug somewhere else
													thresholds.noise.peakDanger!
												: thresholds.noise.danger
										}
										dangerLevel="danger"
									/>
									{!usePeakData && (
										<ThresholdLine
											y={thresholds.noise.warning}
											dangerLevel="warning"
										/>
									)}
								</ChartLineDefault>
							</AggregationTabs>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

const AggregationTabs = ({
	aggregation,
	setAggregation,
	children,
}: {
	aggregation: Aggregation;
	setAggregation: (mode: Aggregation) => void;
	children: React.ReactNode;
}) => {
	const { t } = useTranslation();

	return (
		<span className="relative w-full">
			<div className="absolute top-2 left-2 rounded border">
				<Tabs
					value={aggregation}
					onValueChange={(value) =>
						setAggregation(value as Aggregation)
					}
				>
					<TabsList>
						<TabsTrigger value="average">
							{t(($) => $.average)}
						</TabsTrigger>
						<TabsTrigger value="peak">
							{t(($) => $.peak)}
						</TabsTrigger>
					</TabsList>
				</Tabs>
			</div>
			{children}
		</span>
	);
};

const NoisePageLayout = ({
	children,
	data,
}: {
	children: React.ReactNode;
	data: Array<SensorDataResponseDto>;
}) => (
	<div className="flex w-full flex-col-reverse gap-4 md:flex-row">
		<div className="flex flex-col gap-4 md:w-1/4">
			<Summary exposureType="noise" data={data} />
			<DailyNotes />
		</div>
		<div className="flex flex-1 flex-col items-end gap-4">{children}</div>
	</div>
);
