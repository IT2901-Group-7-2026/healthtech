/** biome-ignore-all lint/suspicious/noAlert: we allow alerts for testing */

import { DailyNotes } from "@/components/daily-notes.tsx";
import { ChartLineDefault, ThresholdLine } from "@/components/line-chart.tsx";
import { Summary } from "@/components/summary.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardTitle } from "@/components/ui/card.tsx";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { CalendarWidget } from "@/features/calendar-widget/calendar-widget.tsx";
import { useDate } from "@/features/date-picker/use-date.ts";
import { useUser } from "@/features/user/user-context.tsx";
import { useView } from "@/features/views/use-view.ts";
import { type View } from "@/features/views/views.ts";
import { WeekWidget } from "@/features/week-widget/week-widget.tsx";
import { useExportPDF } from "@/hooks/use-export-pdf.ts";
import { getLocale } from "@/i18n/locale.ts";
import { sensorQueryOptions } from "@/lib/api.ts";
import {
	type Aggregation,
	Aggregations,
	type SensorDataResponseDto,
} from "@/lib/dto.ts";
import { buildSensorQuery } from "@/lib/sensor-query-utils.ts";
import { type Sensor } from "@/lib/sensors.ts";
import { thresholds } from "@/lib/thresholds.ts";
import {
	calculateSummaryCounts,
	mapSensorDataToTimeBucketStatuses,
} from "@/lib/time-bucket-utils.ts";
import { computeYAxisRange } from "@/lib/utils.ts";
import { useQueries } from "@tanstack/react-query";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useId } from "react";
import { useTranslation } from "react-i18next";

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: help
export default function Noise() {
	const { view } = useView();
	const { t, i18n } = useTranslation();

	const { date } = useDate();
	const { user } = useUser();
	const { exportToPDF } = useExportPDF();
	const chartContainerId = useId();

	const sensor: Sensor = "noise";

	const parseAsAggregation = parseAsStringLiteral(Aggregations);

	const [aggregation, setAggregation] = useQueryState<Aggregation>(
		"aggregation",
		parseAsAggregation.withDefault("average"),
	);
	const usePeakAggregation = aggregation === "peak";

	const query = buildSensorQuery(sensor, view, date, {
		usePeakAggregation,
	});
	const daySummaryQuery = buildSensorQuery(sensor, view, date, {
		granularity: "hour",
		usePeakAggregation,
	});

	const useDaySummary = view === "day";

	const [{ data, isLoading, isError }, { data: daySummaryData }] = useQueries(
		{
			queries: [
				sensorQueryOptions({
					sensor,
					query,
					userId: user.id,
				}),
				sensorQueryOptions({
					sensor,
					query: daySummaryQuery,
					userId: user.id,
					enabled: useDaySummary,
				}),
			],
		},
	);

	if (isLoading) {
		return (
			<NoisePageLayout
				data={data ?? []}
				view={view}
				usePeakAggregation={usePeakAggregation}
			>
				<Card className="flex h-24 w-full items-center">
					<p>{t(($) => $.loadingData)}</p>
				</Card>
			</NoisePageLayout>
		);
	}

	const maxValue = data
		? Math.max(
				...data.map((d) =>
					usePeakAggregation && d.peakValue ? d.peakValue : d.value,
				),
			)
		: 0;

	const minY = 0;
	let maxY = 150;
	if (maxValue > maxY) {
		maxY = computeYAxisRange(data ?? [], {
			step: usePeakAggregation ? 130 : undefined,
		}).maxY;
	}

	const calendarData = mapSensorDataToTimeBucketStatuses(
		data ?? [],
		sensor,
		usePeakAggregation,
	);

	return (
		<div className="flex w-full flex-col-reverse gap-4 md:flex-row">
			<div className="flex flex-col gap-4 md:w-1/5">
				<Summary
					exposureType={sensor}
					view={view}
					data={calculateSummaryCounts(
						(useDaySummary ? daySummaryData : data) ?? [],
						usePeakAggregation,
					)}
				/>
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
							data={calendarData}
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
							dayStartHour={0}
							dayEndHour={23}
							weekStartsOn={1}
							data={calendarData}
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
						<div id={chartContainerId}>
							<AggregationTabs
								aggregation={aggregation}
								setAggregation={setAggregation}
							>
								<ChartLineDefault
									usePeakData={usePeakAggregation}
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
													chartContainerId,
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
											usePeakAggregation
												? // biome-ignore lint/style/noNonNullAssertion: If usePeakAggregation is true and peakDangerLevel is null, there is a bug somewhere else
													thresholds.noise.peakDanger!
												: thresholds.noise.danger
										}
										dangerLevel="danger"
									/>
									{!usePeakAggregation && (
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
			<div className="absolute -top-11 rounded border">
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
	usePeakAggregation,
	view,
}: {
	children: React.ReactNode;
	data: Array<SensorDataResponseDto>;
	usePeakAggregation?: boolean;
	view: View;
}) => (
	<div className="flex w-full flex-col-reverse gap-4 md:flex-row">
		<div className="flex flex-col gap-4 md:w-1/5">
			<Summary
				exposureType="noise"
				view={view}
				data={calculateSummaryCounts(data ?? [], usePeakAggregation)}
			/>
			<DailyNotes />
		</div>
		<div className="flex flex-1 flex-col items-end gap-4">{children}</div>
	</div>
);
