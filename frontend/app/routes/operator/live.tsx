import { DailyNotes } from "@/components/daily-notes";
import { ExposureLineChartCard } from "@/components/exposure-line-chart/exposure-line-chart-card";
import { ThresholdLine } from "@/components/exposure-line-chart/threshold-line";
import { ExposureSlider } from "@/components/exposure-slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group.js";
import { SecurityRegulationsCard } from "@/features/security-regulations-card/security-regulations-card";
import { useUser } from "@/features/user/user-context";
import { sensorQueryOptions } from "@/lib/api";
import { now, toTZDate } from "@/lib/date";
import type { SensorDto } from "@/lib/dto";
import { buildSensorQuery } from "@/lib/sensor-query-utils";
import { getThreshold } from "@/lib/thresholds";
import { computeYAxisRange } from "@/lib/utils";
import type { TZDate } from "@date-fns/tz";
import { useQueries } from "@tanstack/react-query";
import { addMinutes, isWithinInterval, startOfDay, startOfMinute } from "date-fns";
import { Clock } from "lucide-react";
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

type TimeRangeOption = "30" | "60" | "180" | "480";
const parseTimeRange = parseAsStringLiteral(["30", "60", "180", "480"]);

const TIME_RANGE_MINUTES: Record<TimeRangeOption, number> = {
	"30": 30,
	"60": 60,
	"180": 180,
	"480": 480,
};

export default function OperatorLiveView() {
	const { user } = useUser();
	const [selectedUserId] = useQueryState("userId", parseAsString);
	const { t } = useTranslation();

	const [timeRange, setTimeRange] = useQueryState<TimeRangeOption>("timeRange", parseTimeRange.withDefault("30"));

	const targetUserId = selectedUserId ?? user.id;

	const startOfCurrentMinute = startOfMinute(now());
	const end = startOfCurrentMinute;
	const start = addMinutes(startOfCurrentMinute, -TIME_RANGE_MINUTES[timeRange]);

	const [dustTwa1Result, dustTwa25Result, dustTwa10Result, noiseResult, vibrationResult] = useQueries({
		queries: [
			sensorQueryOptions({
				sensor: "dust",
				query: buildSensorQuery("dust", "day", end, {
					granularity: "minute",
					aggregationFunction: "avg",
					field: "pm1_twa",
					startTime: start,
					endTime: end,
				}),
				userId: targetUserId,
			}),
			sensorQueryOptions({
				sensor: "dust",
				query: buildSensorQuery("dust", "day", end, {
					granularity: "minute",
					aggregationFunction: "avg",
					field: "pm25_twa",
					startTime: start,
					endTime: end,
				}),
				userId: targetUserId,
			}),
			sensorQueryOptions({
				sensor: "dust",
				query: buildSensorQuery("dust", "day", end, {
					granularity: "minute",
					aggregationFunction: "avg",
					field: "pm10_twa",
					startTime: start,
					endTime: end,
				}),
				userId: targetUserId,
			}),
			sensorQueryOptions({
				sensor: "noise",
				query: buildSensorQuery("noise", "day", end, {
					granularity: "minute",
					startTime: start,
					endTime: end,
				}),
				userId: targetUserId,
			}),
			sensorQueryOptions({
				sensor: "vibration",
				query: buildSensorQuery("vibration", "day", end, {
					granularity: "minute",
					startTime: toTZDate(startOfDay(start)),
					endTime: end,
				}),
				userId: targetUserId,
			}),
		],
	});

	const dustTwa1Data = dustTwa1Result.data?.data ?? [];
	const dustTwa25Data = dustTwa25Result.data?.data ?? [];
	const dustTwa10Data = dustTwa10Result.data?.data ?? [];
	const noiseData = noiseResult.data?.data ?? [];
	const rawVibrationData = vibrationResult.data?.data ?? [];

	// Since vibration is cumulative over the day we have to fetch data from the start of the day and then filter it to the selected time range
	const vibrationData = useMemo(() => {
		if (!rawVibrationData) {
			return [];
		}

		return rawVibrationData.filter((d) => isWithinInterval(d.time, { start, end }));
	}, [rawVibrationData, start, end]);

	return (
		<div
			className="flex w-full flex-col gap-4 md:grid"
			style={{
				gridTemplateColumns: "minmax(calc(var(--spacing) * 40), 1fr) minmax(0, 3fr) calc(var(--spacing) * 73)",
			}}
		>
			<aside className="flex flex-col gap-4 md:col-start-1">
				<SecurityRegulationsCard />
				<DailyNotes />
			</aside>

			<div className="flex min-w-0 flex-col gap-4 md:col-start-2">
				<Card>
					<CardHeader>
						<CardTitle>{t(($) => $.sensors.dust)}</CardTitle>
					</CardHeader>
					<CardContent>
						<LiveExposureCard
							sensor="dust"
							exposureLabel={"PM1 TWA"}
							exposureUnitLabel="µg/m³"
							chartUnitLabel={t(($) => $.sensors.dustUnit)}
							data={dustTwa1Data ?? []}
							minTime={start}
							maxTime={end}
							chartClassName="h-42 p-0 border-none"
						/>
						<Separator />
						<LiveExposureCard
							sensor="dust"
							exposureLabel={"PM2.5 TWA"}
							exposureField="pm25_twa"
							exposureUnitLabel="µg/m³"
							chartUnitLabel={t(($) => $.sensors.dustUnit)}
							data={dustTwa25Data ?? []}
							minTime={start}
							maxTime={end}
							chartClassName="h-42 p-0 border-none"
						/>
						<Separator />
						<LiveExposureCard
							sensor="dust"
							exposureLabel={"PM10 TWA"}
							exposureField="pm10_twa"
							exposureUnitLabel="µg/m³"
							chartUnitLabel={t(($) => $.sensors.dustUnit)}
							data={dustTwa10Data ?? []}
							minTime={start}
							maxTime={end}
							chartClassName="h-42 p-0 border-none"
						/>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>{t(($) => $.sensors.noise)}</CardTitle>
					</CardHeader>
					<CardContent>
						<LiveExposureCard
							sensor="noise"
							exposureLabel={t(($) => $.sensors.noise)}
							exposureUnitLabel="dB"
							chartUnitLabel="db (TWA)"
							data={noiseData ?? []}
							minTime={start}
							maxTime={end}
							chartClassName="h-42 p-0 border-none"
						/>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>{t(($) => $.sensors.vibration)}</CardTitle>
					</CardHeader>
					<CardContent>
						<LiveExposureCard
							sensor="vibration"
							exposureLabel={t(($) => $.sensors.vibration)}
							exposureUnitLabel={t(($) => $.common.points)}
							chartUnitLabel={t(($) => $.common.points)}
							data={vibrationData ?? []}
							minTime={start}
							maxTime={end}
							chartClassName="h-42 p-0 border-none"
						/>
					</CardContent>
				</Card>
			</div>

			<aside className="md:col-start-3">
				<Card muted={true} className="flex flex-col gap-4">
					<p className="flex items-center gap-2 text-sm">
						<Clock size="1rem" />
						{t(($) => $.live.timeRange.label)}
					</p>
					<ToggleGroup
						type="single"
						value={timeRange}
						variant="outline"
						onValueChange={(value: TimeRangeOption | "") => {
							if (value) {
								setTimeRange(value);
							}
						}}
					>
						<ToggleGroupItem
							className="text-xs"
							value="30"
							aria-label={t(($) => $.live.timeRange.options.thirtyMinutes)}
						>
							<p>{t(($) => $.live.timeRange.options.thirtyMinutes)}</p>
						</ToggleGroupItem>
						<ToggleGroupItem
							className="text-xs"
							value="60"
							aria-label={t(($) => $.live.timeRange.options.oneHour)}
						>
							<p>{t(($) => $.live.timeRange.options.oneHour)}</p>
						</ToggleGroupItem>
						<ToggleGroupItem
							className="text-xs"
							value="180"
							aria-label={t(($) => $.live.timeRange.options.threeHours)}
						>
							<p>{t(($) => $.live.timeRange.options.threeHours)}</p>
						</ToggleGroupItem>
						<ToggleGroupItem
							className="text-xs"
							value="480"
							aria-label={t(($) => $.live.timeRange.options.eightHours)}
						>
							<p>{t(($) => $.live.timeRange.options.eightHours)}</p>
						</ToggleGroupItem>
					</ToggleGroup>
				</Card>
			</aside>
		</div>
	);
}

interface LiveExposureCardProps {
	sensor: "dust" | "noise" | "vibration";
	exposureLabel: string;
	exposureField?: "pm1_twa" | "pm25_twa" | "pm10_twa";
	exposureUnitLabel: string;
	chartUnitLabel: string;
	data: Array<SensorDto>;
	minTime: TZDate;
	maxTime: TZDate;
	chartClassName?: string;
}

const LiveExposureCard = ({
	sensor,
	exposureLabel,
	exposureField,
	exposureUnitLabel,
	chartUnitLabel,
	minTime,
	data,
	maxTime,
	chartClassName,
}: LiveExposureCardProps) => {
	const { t } = useTranslation();

	const maxValue = Math.max(...data.map((d) => d.value));

	const minY = 0;
	let maxY = sensor === "vibration" ? 450 : sensor === "noise" ? 150 : 45;
	if (maxValue > maxY) {
		maxY = computeYAxisRange(data ?? []).maxY;
	}

	const threshold = getThreshold(sensor, exposureField);
	const latestData = data.at(-1);
	const latestValue = latestData?.value;
	const latestDangerLevel = latestData?.dangerLevel;

	return (
		<div className="flex w-full gap-4">
			<ExposureSlider
				label={exposureLabel}
				sensor={sensor}
				field={exposureField}
				value={latestValue}
				dangerLevel={latestDangerLevel}
				unitLabel={exposureUnitLabel}
				className="w-48"
			/>
			<div className="w-128 flex-1 self-stretch">
				<ExposureLineChartCard
					minTime={minTime}
					maxTime={maxTime}
					chartData={data}
					chartTitle=""
					unit={chartUnitLabel}
					maxY={maxY}
					minY={minY}
					lineType="monotone"
					sensor={sensor}
					variant="compact"
					className={chartClassName}
					contentClassName="p-0"
					chartContainerClassName="!aspect-auto"
					hideHeader={true}
					showLegend={false}
					xTickLabels={{
						start: "", // TODO: We should show something like "8 hours ago"
						end: t(($) => $.live.chart.now),
					}}
				>
					<ThresholdLine y={threshold.danger} dangerLevel="danger" />
					<ThresholdLine y={threshold.warning} dangerLevel="warning" />
				</ExposureLineChartCard>
			</div>
		</div>
	);
};
