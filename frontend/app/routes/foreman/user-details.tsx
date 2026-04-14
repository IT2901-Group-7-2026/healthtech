import { DailyBarChart } from "@/components/daily-bar-chart";
import { ChartLineDefault, ChartLineSkeleton, ThresholdLine } from "@/components/line-chart";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { DustChart } from "@/components/ui/dust-chart";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateContext } from "@/features/date-picker/use-date";
import { useExportPDF } from "@/hooks/use-export-pdf";
import { sensorOverviewQueryOptions, sensorQueryOptions } from "@/lib/api";
import {
	type Aggregation,
	Aggregations,
	type SensorDto,
	type SensorOverviewBucketDto,
	type UserWithStatusDto,
} from "@/lib/dto";
import { buildSensorOverviewQuery, buildSensorQuery } from "@/lib/sensor-query-utils";
import { type Sensor, type SensorUnit, sensors } from "@/lib/sensors";
import { getThreshold } from "@/lib/thresholds";
import { mapOverviewBucketsToChartRows } from "@/lib/time-bucket-utils";
import { computeYAxisRange, formatSensorValue, downsampleSensorData, getHourDomain } from "@/lib/utils";
import type { TZDate } from "@date-fns/tz";
import { useQueries, useQuery } from "@tanstack/react-query";
import { addDays, endOfDay, startOfDay, subDays } from "date-fns";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { type ReactNode, useId, useState } from "react";
import { useTranslation } from "react-i18next";
export function UserDetails({
	selectedUser,
	selectedDate,
	sensor,
}: {
	selectedUser: UserWithStatusDto;
	selectedDate: TZDate;
	sensor: Sensor | null;
}) {
	return (
		<section className="flex flex-col gap-6">
			<div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
				<div className="space-y-1">
					<h2 className="font-semibold text-2xl">{selectedUser.username}</h2>
					<p className="text-muted-foreground">{selectedUser.email}</p>
				</div>
			</div>

			<div className="flex flex-col gap-6">
				{sensor === null ? (
					<AllSensorsUserOverview selectedUser={selectedUser} selectedDate={selectedDate} />
				) : sensor === "dust" ? (
					<DustUserChart selectedUser={selectedUser} selectedDate={selectedDate} />
				) : sensor === "noise" ? (
					<NoiseUserChart selectedUser={selectedUser} selectedDate={selectedDate} />
				) : (
					<VibrationUserChart selectedUser={selectedUser} selectedDate={selectedDate} />
				)}
			</div>
		</section>
	);
}

function AllSensorsUserOverview({
	selectedUser,
	selectedDate,
}: {
	selectedUser: UserWithStatusDto;
	selectedDate: TZDate;
}) {
	const [selectedUserId] = useQueryState("userId");

	const {
		data: response,
		isLoading,
		isError,
	} = useQuery(
		sensorOverviewQueryOptions({
			query: buildSensorOverviewQuery([...sensors], "day", selectedDate),
			userId: selectedUser.id,
		}),
	);

	const data = response?.data;
	const hourDomain = response?.hourDomain;

	const { minHour, maxHour } = getHourDomain(
		hourDomain,
		data?.map((d) => d.time),
		"week", // The overview never shows linecharts so should always calculate hour domain with week padding
	);

	return (
		<SensorChartCard isLoading={isLoading} isError={isError} data={data} selectedDate={selectedDate}>
			<DateScopedChart selectedDate={selectedDate}>
				<DailyBarChart
					data={mapOverviewBucketsToChartRows(data ?? [], 0, 23)}
					startHour={minHour}
					endHour={maxHour}
					buildLink={(sensor, dateQueryParam) => {
						const params = new URLSearchParams();
						params.set("sensor", sensor);

						if (selectedUserId) {
							params.set("userId", selectedUserId);
						}

						params.set("date", dateQueryParam);

						return `?${params.toString()}`;
					}}
				/>
			</DateScopedChart>
		</SensorChartCard>
	);
}

function DustUserChart({ selectedUser, selectedDate }: { selectedUser: UserWithStatusDto; selectedDate: TZDate }) {
	const { t, i18n } = useTranslation();
	const { exportToPDF } = useExportPDF();
	const chartContainerId = useId();
	const sensor: Sensor = "dust";

	const [displayUnit, setDisplayUnit] = useState<SensorUnit>("μg/m³");

	const query = buildSensorQuery(sensor, "day", selectedDate);
	const dustThreshold = getThreshold(sensor, query.field);
	const dustPm25TwaThreshold = getThreshold(sensor, "pm25_twa");
	const dustPm10TwaThreshold = getThreshold(sensor, "pm10_twa");

	const [dataResult, dustTwa1Result, dustTwa25Result, dustTwa10Result] = useQueries({
		queries: [
			sensorQueryOptions({
				sensor,
				query,
				userId: selectedUser.id,
			}),
			sensorQueryOptions({
				sensor,
				query: buildSensorQuery(sensor, "day", selectedDate, {
					granularity: "day",
					aggregationFunction: "avg",
					field: "pm1_twa",
				}),
				userId: selectedUser.id,
			}),
			sensorQueryOptions({
				sensor,
				query: buildSensorQuery(sensor, "day", selectedDate, {
					granularity: "day",
					aggregationFunction: "avg",
					field: "pm25_twa",
				}),
				userId: selectedUser.id,
			}),
			sensorQueryOptions({
				sensor,
				query: buildSensorQuery(sensor, "day", selectedDate, {
					granularity: "day",
					aggregationFunction: "avg",
					field: "pm10_twa",
				}),
				userId: selectedUser.id,
			}),
		],
	});

	const data = dataResult?.data?.data;
	const hourDomain = dataResult?.data?.hourDomain;

	const dustTwa1Data = dustTwa1Result.data?.data;
	const dustTwa25Data = dustTwa25Result.data?.data;
	const dustTwa10Data = dustTwa10Result.data?.data;

	const maxValue = data ? Math.max(...data.map((point) => point.value)) : 0;
	const minY = 0;
	let maxY = 45;
	if (maxValue > maxY) {
		maxY = computeYAxisRange(data ?? []).maxY;
	}
	const averageDustExposure =
		data && data.length > 0 ? data.reduce((sum, current) => sum + current.value, 0) / data.length : 0;

	const { minHour, maxHour } = getHourDomain(
		hourDomain,
		data?.map((d) => d.time),
		"day", // TODO: When we add a view picker we should use that here
	);

	return (
		<div className="flex max-w-4xl flex-col gap-6">
			<SensorChartCard
				isLoading={dataResult.isLoading}
				isError={dataResult.isError}
				data={data}
				selectedDate={selectedDate}
				isSensor={true}
			>
				<DateScopedChart selectedDate={selectedDate}>
					<div id={chartContainerId}>
						<ChartLineDefault
							minHour={minHour}
							maxHour={maxHour}
							chartData={downsampleSensorData(sensor, data ?? [])}
							chartTitle={`${t(($) => $.measurement.averageExposure)}: ${formatSensorValue(averageDustExposure, displayUnit)} ${displayUnit}`}
							unit={displayUnit}
							maxY={maxY}
							minY={minY}
							lineType="monotone"
							sensor={sensor}
							dustField={query.field}
							headerRight={
								<div className="flex items-center gap-2">
									<Tabs value={displayUnit} onValueChange={(v) => setDisplayUnit(v as SensorUnit)}>
										<TabsList>
											<TabsTrigger value="μg/m³">{"μg/m³"}</TabsTrigger>
											<TabsTrigger value="mg/m³">{"mg/m³"}</TabsTrigger>
										</TabsList>
									</Tabs>
									<Button
										size="sm"
										variant="outline"
										onClick={() =>
											exportToPDF(
												chartContainerId,
												`${formatChartDate(selectedDate, i18n.language)}-${selectedUser.username}-Dust-Exposure-Overview`,
												`Dust Exposure - ${selectedUser.username} - ${selectedDate.toLocaleDateString(i18n.language)}`,
											)
										}
									>
										{t(($) => $.common.exportAsPdf)}
									</Button>
								</div>
							}
						>
							<ThresholdLine y={dustThreshold.danger} dangerLevel="danger" />
							<ThresholdLine y={dustThreshold.warning} dangerLevel="warning" />
						</ChartLineDefault>
					</div>
				</DateScopedChart>
			</SensorChartCard>

			<div className="flex flex-wrap items-center gap-4">
				{
					<DustChart
						label="PM1 TWA"
						value={dustTwa1Data?.[0]?.value ?? null}
						thresholdValue={dustThreshold.danger}
					/>
				}
				{
					<DustChart
						label="PM2.5 TWA"
						value={dustTwa25Data?.[0]?.value ?? null}
						thresholdValue={dustPm25TwaThreshold.danger}
					/>
				}
				{
					<DustChart
						label="PM10 TWA"
						value={dustTwa10Data?.[0]?.value ?? null}
						thresholdValue={dustPm10TwaThreshold.danger}
					/>
				}
			</div>
		</div>
	);
}

function VibrationUserChart({ selectedUser, selectedDate }: { selectedUser: UserWithStatusDto; selectedDate: TZDate }) {
	const { t, i18n } = useTranslation();
	const { exportToPDF } = useExportPDF();
	const chartContainerId = useId();
	const sensor: Sensor = "vibration";
	const vibrationThreshold = getThreshold(sensor);

	const query = buildSensorQuery(sensor, "day", selectedDate);

	const {
		data: response,
		isLoading,
		isError,
	} = useQuery(
		sensorQueryOptions({
			sensor,
			query,
			userId: selectedUser.id,
		}),
	);

	const data = response?.data;
	const hourDomain = response?.hourDomain;

	const maxValue = data ? Math.max(...data.map((point) => point.value)) : 0;
	const minY = 0;
	let maxY = 450;
	if (maxValue > maxY) {
		maxY = computeYAxisRange(data ?? []).maxY;
	}
	const totalVibrationExposure = data && data.length > 0 ? data[data.length - 1].value : 0;

	const { minHour, maxHour } = getHourDomain(
		hourDomain,
		data?.map((d) => d.time),
		"day", // TODO: When we add a view picker we should use that here
	);

	return (
		<SensorChartCard
			isLoading={isLoading}
			isError={isError}
			data={data}
			selectedDate={selectedDate}
			isSensor={true}
		>
			<DateScopedChart selectedDate={selectedDate}>
				<div id={chartContainerId}>
					<ChartLineDefault
						minHour={minHour}
						maxHour={maxHour}
						chartData={downsampleSensorData(sensor, data ?? [])}
						chartTitle={`${t(($) => $.common.total)}: ${Math.trunc(totalVibrationExposure)} ${t(($) => $.common.points)}`}
						unit={t(($) => $.common.points)}
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
										`${formatChartDate(selectedDate, i18n.language)}-${selectedUser.username}-Vibration-Exposure-Overview`,
										`Vibration Exposure - ${selectedUser.username} - ${selectedDate.toLocaleDateString(i18n.language)}`,
									)
								}
							>
								{t(($) => $.common.exportAsPdf)}
							</Button>
						}
					>
						<ThresholdLine y={vibrationThreshold.danger} dangerLevel="danger" />
						<ThresholdLine y={vibrationThreshold.warning} dangerLevel="warning" />
					</ChartLineDefault>
				</div>
			</DateScopedChart>
		</SensorChartCard>
	);
}

function NoiseUserChart({ selectedUser, selectedDate }: { selectedUser: UserWithStatusDto; selectedDate: TZDate }) {
	const { t, i18n } = useTranslation();
	const { exportToPDF } = useExportPDF();
	const chartContainerId = useId();
	const sensor: Sensor = "noise";
	const parseAsAggregation = parseAsStringLiteral(Aggregations);
	const [aggregation, setAggregation] = useQueryState<Aggregation>(
		"aggregation",
		parseAsAggregation.withDefault("average"),
	);
	const usePeakAggregation = aggregation === "peak";
	const noiseThreshold = getThreshold(sensor);

	const query = buildSensorQuery(sensor, "day", selectedDate, {
		usePeakAggregation,
	});

	const {
		data: response,
		isLoading,
		isError,
	} = useQuery(
		sensorQueryOptions({
			sensor,
			query,
			userId: selectedUser.id,
		}),
	);

	const data = response?.data;
	const hourDomain = response?.hourDomain;

	const maxValue = data
		? Math.max(...data.map((point) => (usePeakAggregation && point.peakValue ? point.peakValue : point.value)))
		: 0;
	const minY = 0;
	let maxY = 150;
	if (maxValue > maxY) {
		maxY = computeYAxisRange(data ?? [], {
			step: usePeakAggregation ? 130 : undefined,
		}).maxY;
	}
	const averageNoiseExposure =
		data && data.length > 0
			? data.reduce(
					(sum, point) => sum + (usePeakAggregation && point.peakValue ? point.peakValue : point.value),
					0,
				) / data.length
			: 0;

	const { minHour, maxHour } = getHourDomain(
		hourDomain,
		data?.map((d) => d.time),
		"day", // TODO: When we add a view picker we should use that here
	);

	return (
		<div className="flex max-w-4xl flex-col gap-4">
			<Tabs value={aggregation} onValueChange={(value) => setAggregation(value as Aggregation)}>
				<TabsList>
					<TabsTrigger value="average">{t(($) => $.measurement.average)}</TabsTrigger>
					<TabsTrigger value="peak">{t(($) => $.measurement.peak)}</TabsTrigger>
				</TabsList>
			</Tabs>

			<SensorChartCard
				isLoading={isLoading}
				isError={isError}
				data={data}
				selectedDate={selectedDate}
				isSensor={true}
			>
				<DateScopedChart selectedDate={selectedDate}>
					<div id={chartContainerId}>
						<ChartLineDefault
							minHour={minHour}
							maxHour={maxHour}
							usePeakData={usePeakAggregation}
							chartData={downsampleSensorData(sensor, data ?? [])}
							chartTitle={`${t(($) => $.measurement.averageExposure)}: ${Math.trunc(averageNoiseExposure)} db`}
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
											`${formatChartDate(selectedDate, i18n.language)}-${selectedUser.username}-Noise-Exposure-Overview`,
											`Noise Exposure - ${selectedUser.username} - ${selectedDate.toLocaleDateString(i18n.language)}`,
										)
									}
								>
									{t(($) => $.common.exportAsPdf)}
								</Button>
							}
						>
							<ThresholdLine
								y={
									usePeakAggregation
										? (noiseThreshold.peakDanger ?? noiseThreshold.danger)
										: noiseThreshold.danger
								}
								dangerLevel="danger"
							/>
							{!usePeakAggregation && <ThresholdLine y={noiseThreshold.warning} dangerLevel="warning" />}
						</ChartLineDefault>
					</div>
				</DateScopedChart>
			</SensorChartCard>
		</div>
	);
}

function SensorChartCard({
	isLoading,
	isError,
	data,
	isSensor,
	selectedDate,
	children,
}: {
	isLoading: boolean;
	isError: boolean;
	data: Array<SensorDto> | Array<SensorOverviewBucketDto> | undefined;
	isSensor?: boolean;
	selectedDate: TZDate;
	children: ReactNode;
}) {
	const { t, i18n } = useTranslation();

	if (isLoading && isSensor) {
		return <ChartLineSkeleton />;
	}

	if (isLoading) {
		return (
			<Card className="flex w-full items-center">
				<p>{t(($) => $.common.loading)}</p>
			</Card>
		);
	}

	if (isError) {
		return (
			<Card className="flex w-full items-center">
				<p>{t(($) => $.common.error)}</p>
			</Card>
		);
	}

	if (!data || data.length === 0) {
		return (
			<Card className="flex w-full items-center">
				<CardTitle>{formatChartDate(selectedDate, i18n.language)}</CardTitle>
				<p>{t(($) => $.common.noData)}</p>
			</Card>
		);
	}

	return <div className="w-full max-w-4xl">{children}</div>;
}

function DateScopedChart({ selectedDate, children }: { selectedDate: TZDate; children: ReactNode }) {
	return (
		<DateContext
			value={{
				date: selectedDate,
				selection: {
					start: startOfDay(selectedDate),
					end: endOfDay(selectedDate),
				},
				navigate: {
					previousValue: subDays(selectedDate, 1),
					nextValue: addDays(selectedDate, 1),
					previous: () => {},
					next: () => {},
				},
				setDate: () => {},
			}}
		>
			{children}
		</DateContext>
	);
}

function formatChartDate(selectedDate: TZDate, locale: string) {
	return selectedDate.toLocaleDateString(locale, {
		day: "numeric",
		month: "long",
		year: "numeric",
	});
}
